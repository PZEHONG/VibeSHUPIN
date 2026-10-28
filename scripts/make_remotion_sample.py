"""Build the approved three-scene sample from existing narration, without any API calls."""
import argparse
import copy
import json
from pathlib import Path
import re
import subprocess
import sys

from media_tools import media_tool
from motion_project import frame_range, read_json, source_hashes, validate_motion, write_json


def clip_timeline(timing, subtitles, start, end):
    interval = frame_range(start, end, timing['duration'])
    a, b = interval[0] / 30, interval[1] / 30
    duration = (interval[1] - interval[0]) / 30
    local = {k: copy.deepcopy(v) for k, v in timing.items() if k != 'segments'}
    local.update(duration=duration, segments=[], start_lead=0, tail=0)
    for segment in timing['segments']:
        if segment['end'] <= a or segment['start'] >= b:
            continue
        if segment['start'] < a - 1/60 - 1e-8 or segment['end'] > b + 1/60 + 1e-8:
            raise ValueError('样片边界切入了完整旁白句，请按段落边界选择范围')
        item = copy.deepcopy(segment)
        item.update(start=max(0, segment['start'] - a), end=min(duration, segment['end'] - a))
        item['dur'] = item['end'] - item['start']
        local['segments'].append(item)
    result = []
    for sub in subtitles:
        if sub['b'] <= a or sub['a'] >= b:
            continue
        if sub['a'] < a - 1/60 - 1e-8 or sub['b'] > b + 1/60 + 1e-8:
            raise ValueError('样片边界切入了字幕，请按完整句选择范围')
        item = {'start': max(0, sub['a'] - a), 'end': min(duration, sub['b'] - a), 'zh': sub['zh']}
        if sub.get('en'):
            item['en'] = sub['en']
        result.append(item)
    if not local['segments'] or not result:
        raise ValueError('指定范围没有完整旁白或字幕')
    return local, result, interval


def build_sample(source, target):
    source, target = Path(source).resolve(), Path(target).resolve()
    if target.exists() and any(target.iterdir()):
        raise ValueError('样片目标目录不是空目录，请保留已有工程并指定新目录')
    script = read_json(source / 'script.json')
    timing = read_json(source / 'audio/timings.json')
    match = re.search(r'\bconst\s+SUBS\s*=\s*(\[[\s\S]*?\]);', (source / 'film.js').read_text(encoding='utf-8'))
    if not match:
        raise ValueError('源 film.js 没有可读取的 JSON 字幕表')
    local, subs, interval = clip_timeline(timing, json.loads(match[1]), 12.091, 24.961)
    ids = {s['id'] for s in local['segments']}
    required = {'not_memorial', 'goldfish', 'rain', 'after_rain'}
    if ids != required:
        raise ValueError('本示例要求《百年孤独》r3 的四个指定旁白段落')
    script = {k: copy.deepcopy(v) for k, v in script.items() if k != 'visual_style'}
    script['segments'] = [s for s in script['segments'] if s['id'] in ids]
    audio = target / 'audio'
    audio.mkdir(parents=True, exist_ok=True)
    write_json(target / 'script.json', script)
    write_json(audio / 'timings.json', local)
    a, b = interval[0] / 30, interval[1] / 30
    subprocess.run([media_tool('ffmpeg'), '-v', 'error', '-n', '-i', str(source / 'audio/narration.wav'),
        '-af', f'atrim=start={a:.12f}:end={b:.12f},asetpts=PTS-STARTPTS',
        '-c:a', 'pcm_s16le', '-ar', '48000', str(audio / 'narration.wav')], check=True)
    segments = {s['id']: s for s in local['segments']}
    fish_start, rain_start = segments['goldfish']['start'], segments['rain']['start']
    rain_stop = (segments['after_rain']['start'] - rain_start) / (local['duration'] - rain_start)
    shots = [
        {'id': 'corridor', 'segment_ids': ['not_memorial'], 'start': 0, 'end': fish_start,
         'scene_type': 'corridor', 'scene_props': {'cycles': 1}, 'kind': '情绪隐喻', 'evidence': '',
         'intent': '经过相同的门，最后又回到标记为一的起点；走得再远也回到旧路'},
        {'id': 'goldfish', 'segment_ids': ['goldfish'], 'start': fish_start, 'end': rain_start,
         'scene_type': 'goldfish', 'scene_props': {'cycles': 1}, 'kind': '原著场景',
         'evidence': '沿用源工程事实表：上校晚年制作小金鱼，再熔掉重做；图形为该行为的抽象化呈现。',
         'intent': '小金鱼进入坩埚融化，再形成相同的小金鱼，看到徒劳的重复'},
        {'id': 'rain', 'segment_ids': ['rain', 'after_rain'], 'start': rain_start, 'end': local['duration'],
         'scene_type': 'rain', 'scene_props': {'stop_at': rain_stop}, 'kind': '情绪隐喻',
         'evidence': '沿用源工程事实表：马孔多大雨持续四年十一个月零两天。雨停后不动的人为隐喻。',
         'intent': '雨线与时间经过；雨停以后，同一个人仍停在同一个位置'},
    ]
    value = {'schema_version': 1, 'renderer': 'remotion', 'theme': 'M01', 'draft': False,
        'title': script['book_title'], 'author': script['author'], 'width': 1080, 'height': 1920, 'fps': 30,
        'duration': local['duration'], 'source_hashes': source_hashes(target),
        'shots': shots, 'subtitles': subs, 'title_card': None, 'closing': None}
    errors = validate_motion(value, target)
    if errors:
        raise ValueError('\n'.join(errors))
    write_json(target / 'motion.json', value)
    write_json(target / 'sample-source.json', {'project': str(source), 'source_hashes': source_hashes(source),
        'requested_seconds': [12.091, 24.961], 'source_frame_range': list(interval),
        'source_seconds': [a, b], 'fps': 30, 'frames': interval[1] - interval[0],
        'audio': '原 narration.wav 按相同量化边界解码裁切为 PCM；未重配音。',
        'subtitles': '原 film.js 中 JSON SUBS，只调整起止时间，不改可见文字。'})
    lines = ['# 百年孤独 · 纯 Remotion 样片', '', 'M01 文学纸艺；1080×1920 / 30fps；只有原有旁白。', '',
        '源工程：bainiangudu-r3；源画面区间 [363,749) 帧；样片 386 帧。', '',
        '| 时间 | 旁白关联 | 画面与动作 | 观众理解 | 性质与依据 |', '|---|---|---|---|---|']
    for shot in shots:
        lines.append(f'| {shot["start"]:.3f}–{shot["end"]:.3f} | {"、".join(shot["segment_ids"])} | '
            f'{shot["scene_type"]} | {shot["intent"]} | {shot["kind"]}：{shot["evidence"] or "循环门廊为情绪隐喻"} |')
    lines += ['', '## 事实与示意', '',
        '事实来源沿用原项目 storyboard.md，原表作为 source-storyboard.md 随工程保留；本次未重新开展书籍考据。',
        '门廊、剪影和雨停后仍站着的人均为隐喻；小金鱼以程序图形抽象呈现制作与重铸。',
        '人物未指认具体原著角色，无新增引文。四年十一个月沿用旁白简写，不取代完整事实时长。', '',
        '## 制作状态', '', '三镜样片供用户审看；完整约45秒示例待样片审看后扩展。', '']
    (target / 'storyboard.md').write_text('\n'.join(lines), encoding='utf-8')
    (target / 'source-storyboard.md').write_text((source / 'storyboard.md').read_text(encoding='utf-8'), encoding='utf-8')
    return value


def main():
    parser = argparse.ArgumentParser(description='从既有《百年孤独》r3 制作纯 Remotion 样片工程')
    parser.add_argument('source'); parser.add_argument('target')
    args = parser.parse_args()
    try:
        result = build_sample(args.source, args.target)
        print(f'样片工程：{Path(args.target).resolve()}；{result["duration"]:.6f}s / 386 帧')
        return 0
    except (ValueError, OSError, KeyError, TypeError, subprocess.CalledProcessError) as exc:
        print(f'样片准备失败：{exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
