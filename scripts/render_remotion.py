"""Remotion renderer: validate first, render silent visuals, inspect real frames."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

from motion_project import (assert_snapshot_current, boundary_frame, frame_range, load_motion_snapshot,
                            renderer_fingerprint, total_frames, write_json, asset_hashes)

ROOT = Path(__file__).resolve().parents[1]
REMOTION = ROOT / 'remotion'


def chrome_path():
    configured = os.environ.get('VIBE_CHROME_PATH')
    if configured:
        if not Path(configured).is_file():
            raise ValueError('VIBE_CHROME_PATH 指向的浏览器不存在')
        return configured
    for candidate in ('C:/Program Files/Google/Chrome/Application/chrome.exe',
                      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'):
        if Path(candidate).is_file():
            return candidate
    raise ValueError('未找到已有 Chrome，请设置 VIBE_CHROME_PATH；不会另行下载浏览器')


def stage(project, motion):
    """Stable per-project asset area; no project paths are exposed as browser file URLs."""
    key = hashlib.sha256(str(project.resolve()).encode()).hexdigest()[:16]
    public = REMOTION / 'public'
    fonts = public / 'fonts'
    fonts.mkdir(parents=True, exist_ok=True)
    names = ['NotoSerifSC-VF.ttf', 'CormorantGaramond.ttf']
    if motion.get('theme') in ('M02', 'CUSTOM'):
        names.append('WenYue-HuiMoShouShu-J.otf')
    for name in names:
        source, target = ROOT / 'engine/fonts' / name, fonts / name
        if not source.is_file():
            raise ValueError(f'缺少本地字体 engine/fonts/{name}，请先放入字体再渲染')
        if not target.is_file() or source.read_bytes() != target.read_bytes():
            shutil.copy2(source, target)
    staged = public / 'projects' / key
    staged.mkdir(parents=True, exist_ok=True)
    for name in asset_hashes(project, motion):
        target = staged / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(project / name, target)
    write_json(staged / 'motion.json', motion)
    props = {'motion': motion, 'fontBase': 'fonts', 'assetBase': f'projects/{key}'}
    write_json(REMOTION / 'studio-props.json', props)
    return props


def sheet(paths, output, labels):
    from PIL import Image, ImageDraw
    width, height, cols = 216, 384, min(4, len(paths))
    canvas = Image.new('RGB', (cols * width, math.ceil(len(paths) / cols) * (height + 28)), '#EDE5D5')
    draw = ImageDraw.Draw(canvas)
    for i, (path, label) in enumerate(zip(paths, labels)):
        with Image.open(path) as source:
            image = source.convert('RGB').resize((width, height), Image.Resampling.LANCZOS)
        x, y = i % cols * width, i // cols * (height + 28)
        canvas.paste(image, (x, y))
        draw.text((x + 8, y + height + 5), str(label), fill='#292D2B')
    canvas.save(output, quality=94)


def validate_geometry(path):
    values = json.loads(Path(path).read_text(encoding='utf-8'))
    if not values:
        raise ValueError('未取得字幕 DOM 测量结果，不能宣称边界检查通过')
    bad = [r for item in values for r in item['bounds'] if
           r['bottom'] > 1594.01 or r['left'] < 60 or r['right'] > 1020 or r['scrollWidth'] > r['width'] + 1]
    if bad:
        raise ValueError('实测字幕超出安全区：' + json.dumps(bad, ensure_ascii=False))
    print(f'字幕 DOM 边界检查通过（{len(values)} 帧测量）')


def add_clip_audio(video, narration, output, interval, fps):
    """Attach the source narration at the same quantized frame boundaries."""
    from media_tools import media_tool
    a, b = (frame / fps for frame in interval)
    subprocess.run([media_tool('ffmpeg'), '-v', 'error', '-n', '-i', str(video), '-i', str(narration),
        '-filter_complex', f'[1:a]atrim=start={a:.12f}:end={b:.12f},asetpts=PTS-STARTPTS[a]',
        '-map', '0:v:0', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
        '-ar', '48000', '-movflags', '+faststart', str(output)], check=True)


def main():
    parser = argparse.ArgumentParser(description='纯 Remotion 动态书评：无声画面、静帧、拼图与预览')
    parser.add_argument('project')
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument('--stills', nargs='+', type=float, metavar='SECONDS')
    modes.add_argument('--sheet', type=int, metavar='COUNT')
    modes.add_argument('--clip', nargs=2, type=float, metavar=('START', 'END'))
    modes.add_argument('--det', action='store_true')
    modes.add_argument('--serve', action='store_true')
    parser.add_argument('--name', default='clip', help='--clip 的输出文件名，不带扩展名')
    parser.add_argument('--clip-audio', action='store_true', help='为 --clip 片段按帧裁切并合入原旁白')
    parser.add_argument('--jobs', type=int, default=2)
    args = parser.parse_args()
    try:
        if args.clip_audio and not args.clip:
            raise ValueError('--clip-audio 必须配合 --clip')
        project = Path(args.project).resolve()
        motion, motion_digest = load_motion_snapshot(project)
        renderer_digest = renderer_fingerprint()
        if not (project / 'storyboard.md').is_file():
            raise ValueError('缺少 storyboard.md 分镜依据')
        total = total_frames(motion['duration'], motion['fps'])
        if not 1 <= args.jobs <= 16:
            raise ValueError('--jobs 必须在 1–16 之间')
        interval = frame_range(*args.clip, motion['duration']) if args.clip else (0, total)
        if args.name != Path(args.name).name or '/' in args.name or '\\' in args.name or args.name in ('', '.', '..'):
            raise ValueError('--name 只能是文件名')
        times = args.stills
        if times and any(not math.isfinite(t) or not 0 <= t < motion['duration'] for t in times):
            raise ValueError('静帧时间必须在 [0,duration) 内')
        if args.sheet is not None:
            if not 1 <= args.sheet <= 100:
                raise ValueError('--sheet 必须在 1–100 之间')
            times = [(i + .5) * motion['duration'] / args.sheet for i in range(args.sheet)]
        if args.det:
            times = [motion['duration'] * p for p in (.12, .47, .82)]
        node = shutil.which('node')
        if not node or not (REMOTION / 'node_modules/@remotion/renderer').is_dir():
            raise ValueError('缺少 Remotion 依赖；请在 remotion/ 运行 npm ci（需要 Node.js）')
        browser = chrome_path()
        props = stage(project, motion)
        if args.serve:
            command = [node, str(REMOTION / 'node_modules/@remotion/cli/remotion-cli.js'),
                       'studio', 'src/index.ts', '--props=studio-props.json', '--no-open']
            return subprocess.call(command, cwd=REMOTION)
        review, renders = project / 'review', project / 'renders'
        review.mkdir(exist_ok=True); renders.mkdir(exist_ok=True)
        cache = REMOTION / '.cache'
        cache.mkdir(exist_ok=True)
        # A unique request/build directory also prevents simultaneous render jobs overwriting props.
        with tempfile.TemporaryDirectory(prefix='render-', dir=cache) as scratch:
            request = {'props': props, 'browserExecutable': browser, 'concurrency': args.jobs,
                       'bundleDir': str(Path(scratch) / 'bundle'), 'from': interval[0], 'to': interval[1]}
            # Measure every subtitle, even if the review sheet happens to miss a short line.
            audit_frames = sorted({min(total-1, (boundary_frame(s['start']) + boundary_frame(s['end']) - 1)//2)
                                   for s in motion['subtitles']})
            request.update(auditStills=[{'frame': f, 'output': str(Path(scratch) / f'audit_{f}.png')}
                                       for f in audit_frames], geometryOutput=str(review / 'subtitle-bounds.json'))
            if times:
                frames = [min(total - 1, boundary_frame(t)) for t in times]
                entries = [{'frame': f, 'output': str(review / f's_{f:06d}.png')} for f in frames]
                if args.det:
                    entries += [{'frame': f, 'output': str(review / f'det_{f:06d}.png')} for f in reversed(frames)]
                request.update(mode='stills', stills=entries, geometryOutput=str(review / 'subtitle-bounds.json'))
            else:
                out = renders / (f'{args.name}.mp4' if args.clip else 'raw.mp4')
                request.update(mode='media', output=str(out))
            request_path = Path(scratch) / 'request.json'
            write_json(request_path, request)
            subprocess.run([node, str(REMOTION / 'scripts/render.mjs'), str(request_path)], cwd=REMOTION, check=True)
            assert_snapshot_current(project, motion_digest, motion)
            if renderer_fingerprint() != renderer_digest:
                raise ValueError('渲染过程中场景代码或字体发生变化，请重新渲染')
            validate_geometry(review / 'subtitle-bounds.json')
            write_json(review / 'subtitle-bounds.meta.json', {'motion_sha256': motion_digest,
                'renderer_sha256': renderer_digest, 'bounds_sha256': hashlib.sha256(
                    (review / 'subtitle-bounds.json').read_bytes()).hexdigest(), 'audit_frames': audit_frames})
        if times:
            if args.sheet:
                sheet([Path(e['output']) for e in entries], review / 'sheet.jpg', [f'{f/30:.2f}s' for f in frames])
                print('拼图：', review / 'sheet.jpg')
            if args.det:
                from PIL import Image, ImageChops
                for f in frames:
                    with Image.open(review / f's_{f:06d}.png') as a, Image.open(review / f'det_{f:06d}.png') as b:
                        if ImageChops.difference(a.convert('RGB'), b.convert('RGB')).getbbox():
                            raise ValueError(f'帧 {f} 在乱序渲染后发生变化')
                print('确定性检查通过：同帧乱序渲染像素一致')
        elif args.clip:
            write_json(renders / f'{args.name}.clip.json', {'source_start_frame': interval[0],
                'source_end_frame': interval[1], 'fps': 30, 'duration': (interval[1] - interval[0]) / 30,
                'note': '此片段只有画面；不能直接与整条旁白合成。'})
        if args.clip_audio:
            voiced = renders / f'{args.name}-voice.mp4'
            add_clip_audio(out, project / 'audio/narration.wav', voiced, interval, motion['fps'])
            assert_snapshot_current(project, motion_digest, motion)
            write_json(voiced.with_suffix('.render.json'), {
                'motion_sha256': motion_digest, 'renderer_sha256': renderer_digest,
                'visual_sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
                'narration_sha256': motion['source_hashes']['audio/narration.wav'],
                'output_sha256': hashlib.sha256(voiced.read_bytes()).hexdigest(),
                'source_frame_range': list(interval), 'fps': motion['fps']})
            print('带旁白片段：', voiced)
        if not times:
            write_json(out.with_suffix('.render.json'), {
                'motion_sha256': motion_digest, 'renderer_sha256': renderer_digest,
                'output_sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
                'frames': interval[1] - interval[0], 'source_frame_range': list(interval), 'audio': False})
        return 0
    except (ValueError, OSError, KeyError, TypeError, subprocess.CalledProcessError) as exc:
        print(f'Remotion 渲染失败：{exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
