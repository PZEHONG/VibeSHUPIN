"""Remotion project checks; shared media probing is supplied by check_film.py."""
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess

from motion_project import boundary_frame, load_motion, read_json, renderer_fingerprint, total_frames

MANUAL = [
    '静音遮住字幕审看：小镇、人物、法庭、夜间与阅读五个模块的转场和人物关系是否清楚。',
    '完整看听：旁白与动作对齐，BGM 始终托在讲述之下，字幕在手机宽度仍清楚。',
    '事实与隐喻对照 storyboard.md；自动检查不等于重新核验原著。',
]


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def inspect_motion(project, no_audio, probe, loudness):
    results = []
    def check(name, ok, detail='', warn=False):
        results.append({'name': name, 'status': 'PASS' if ok else 'WARN' if warn else 'FAIL', 'detail': detail})
    project = Path(project)
    try:
        motion = load_motion(project)
        check('Remotion 分镜、字幕、源摘要与时间轴', True)
    except (ValueError, OSError, KeyError, TypeError) as exc:
        check('Remotion 分镜、字幕、源摘要与时间轴', False, str(exc))
        return results
    check('Remotion 分镜表存在', (project / 'storyboard.md').is_file())
    check('工程引擎文件不混用', not any((project / p).exists() for p in ('film.js', 'index.html', 'art-direction.json')))
    declared_bgm = (motion.get('audio') or {}).get('bgm')
    allowed = {'audio/narration.wav'}
    if declared_bgm:
        allowed.add(Path(declared_bgm).as_posix())
    stray = [str(p.relative_to(project)) for p in (project / 'audio').rglob('*')
        if p.is_file() and p.suffix.lower() in ('.wav', '.mp3', '.m4a', '.aac', '.flac', '.ogg')
        and not p.parent.name.startswith('vo') and
        Path(p).resolve() not in {(project / a).resolve() for a in allowed}]
    check('audio/ 只有旁白源、旁白分段与已声明 BGM', not stray, '、'.join(stray))
    if declared_bgm:
        bgm_path = (project / declared_bgm).resolve()
        check('已声明 BGM 存在且位于工程内',
              bgm_path.is_relative_to(project.resolve()) and bgm_path.is_file(), declared_bgm)
    expected_frames = total_frames(motion['duration'])
    renderer_digest = renderer_fingerprint()
    raw = project / 'renders/raw.mp4'
    final = project / 'renders/final.mp4'
    for path, label in ((raw, '无声画面'), (final, '成片')):
        if path == final and no_audio:
            continue
        if not path.is_file():
            if not no_audio:
                check(f'{label}存在', False, str(path))
            continue
        try:
            info = probe(path)
            videos = [s for s in info['streams'] if s['codec_type'] == 'video']
            audios = [s for s in info['streams'] if s['codec_type'] == 'audio']
            if path == raw:
                check('raw.mp4 确实无声、没有音轨', not audios)
            else:
                check('成片 AAC 单音轨混音', len(audios) == 1 and audios[0].get('codec_name') == 'aac')
                if audios:
                    ad = float(audios[0].get('duration', info['format']['duration']))
                    nd = float(probe(project / 'audio/narration.wav')['format']['duration'])
                    check('成片音轨与源旁白等长', abs(ad - nd) < .06, f'{ad:.6f}s / {nd:.6f}s')
            check(f'{label}为一路 H.264 / 1080×1920 / 30fps', len(videos) == 1 and
                videos[0].get('codec_name') == 'h264' and videos[0].get('width') == 1080 and
                videos[0].get('height') == 1920 and videos[0].get('r_frame_rate') == '30/1')
            if videos:
                count = videos[0].get('nb_frames')
                check(f'{label}帧数与分镜一致', count is not None and int(count) == expected_frames,
                      f'{count} / {expected_frames} 帧')
            check(f'{label}总时长与时间轴一致', abs(float(info['format']['duration']) - expected_frames/30) < .06)
            receipt = path.with_suffix('.render.json')
            if not receipt.exists():
                check(f'{label}渲染来源记录存在', False, '请重新渲染/合成以生成来源记录')
            else:
                meta = read_json(receipt)
                check(f'{label}与当前分镜及实际输出一致', meta.get('motion_sha256') == digest(project / 'motion.json')
                      and meta.get('renderer_sha256') == renderer_digest
                      and meta.get('output_sha256') == digest(path))
                if path == final:
                    expected_audio = ['audio/narration.wav'] + ([declared_bgm] if declared_bgm else [])
                    bgm_ok = (not declared_bgm or meta.get('bgm_sha256') == digest(project / declared_bgm))
                    check('最终合成只使用当前无声画面、当前旁白与已声明 BGM',
                        meta.get('raw_sha256') == digest(raw) and
                        meta.get('narration_sha256') == digest(project / 'audio/narration.wav') and
                        meta.get('audio_inputs') == expected_audio and bgm_ok)
        except (ValueError, OSError, KeyError, TypeError, subprocess.CalledProcessError) as exc:
            check(f'{label}可探测', False, str(exc))
    bounds = project / 'review/subtitle-bounds.json'
    if bounds.is_file():
        try:
            entries = read_json(bounds)
            meta = read_json(project / 'review/subtitle-bounds.meta.json')
            expected_audits = sorted({min(expected_frames-1, (boundary_frame(s['start']) + boundary_frame(s['end']) - 1)//2)
                                     for s in motion['subtitles']})
            check('字幕测量对应当前分镜、渲染代码并覆盖全部字幕',
                meta.get('motion_sha256') == digest(project / 'motion.json') and
                meta.get('renderer_sha256') == renderer_digest and meta.get('bounds_sha256') == digest(bounds)
                and meta.get('audit_frames') == expected_audits and set(expected_audits).issubset(
                    {item['frame'] for item in entries}))
            values = [r for item in entries for r in item['bounds']]
            check('实际字幕 DOM 边界安全', bool(values) and all(r['bottom'] <= 1594.01 and
                r['left'] >= 60 and r['right'] <= 1020 and r['scrollWidth'] <= r['width'] + 1 for r in values))
        except (ValueError, OSError, KeyError, TypeError) as exc:
            check('实际字幕 DOM 边界安全', False, str(exc))
    else:
        check('实际字幕 DOM 边界尚待抽帧测量', False, '运行 render_remotion.py --sheet 12', warn=no_audio)
    if final.is_file() and not no_audio:
        try:
            lm = loudness(final)
            if lm:
                level, peak = float(lm['input_i']), float(lm['input_tp'])
                check('混音约 -16 LUFS、真峰值≤-1dBTP', abs(level+16) <= 1.5 and peak <= -1,
                      f'{level} LUFS / {peak} dBTP', warn=True)
        except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as exc:
            check('旁白响度可测量', False, str(exc))
    return results


def report_motion(project, no_audio, as_json, probe, loudness):
    results = inspect_motion(project, no_audio, probe, loudness)
    if as_json:
        print(json.dumps({'project': str(project), 'renderer': 'remotion', 'results': results, 'manual': MANUAL},
                         ensure_ascii=False, indent=2))
    else:
        for item in results:
            print(f'[{item["status"]}] {item["name"]}' + (f'：{item["detail"]}' if item['detail'] else ''))
        print('\n人工审片（自动检查不能代替）：')
        for text in MANUAL:
            print('- ' + text)
    return 1 if any(r['status'] == 'FAIL' for r in results) else 0
