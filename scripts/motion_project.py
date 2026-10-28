"""Editable, frame-accurate contracts for pure Remotion book reviews."""
import hashlib
import json
import math
from pathlib import Path
import re

SOURCE_FILES = ('script.json', 'audio/timings.json', 'audio/narration.wav')
OIL_FULL_SCENES = {'market', 'portraits', 'table', 'city', 'quarrel', 'book', 'empty_table'}
TKAM_SCENES = {'tkam_town', 'tkam_porch', 'tkam_portraits', 'tkam_boo_house', 'tkam_tree',
               'tkam_court', 'tkam_trial', 'tkam_walk', 'tkam_night', 'tkam_boo_porch',
               'tkam_mockingbird', 'tkam_reading'}
SCENES = {'story_discovery': set(), 'story_tree': set(), 'story_court': set(), 'media': {'layers'}, 'corridor': {'cycles'}, 'goldfish': {'cycles'}, 'rain': {'stop_at'},
          **{name: set() for name in ('mock_evidence', 'mock_defense', 'mock_crowd', 'mock_court', 'mock_gallery', 'mock_voice')},
          **{name: set() for name in OIL_FULL_SCENES | TKAM_SCENES}}


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def source_hashes(project):
    return {name: hashlib.sha256((Path(project) / name).read_bytes()).hexdigest()
            for name in SOURCE_FILES if (Path(project) / name).is_file()
            and (Path(project) / name).resolve().is_relative_to(Path(project).resolve())}


def asset_hashes(project, motion):
    """Hash referenced local media; reject traversal, symlinks outside the project and missing files."""
    project = Path(project).resolve()
    result = {}
    for shot in motion.get('shots', []):
        if shot.get('scene_type') != 'media':
            continue
        layers = shot.get('scene_props', {}).get('layers')
        if not isinstance(layers, list) or not layers:
            raise ValueError('media 场景必须提供非空 layers')
        for layer in layers:
            if not isinstance(layer, dict) or layer.get('type') not in ('image', 'video'):
                raise ValueError('素材类型必须为 image 或 video')
            name = layer.get('src')
            if not isinstance(name, str) or not name.startswith('assets/') or '\\' in name:
                raise ValueError('素材路径必须位于 assets/ 下')
            path = (project / name).resolve()
            if not path.is_relative_to(project / 'assets') or not path.is_file():
                raise ValueError(f'素材不存在或路径越界：{name}')
            for key in ('scaleFrom', 'scaleTo', 'xFrom', 'xTo', 'opacity'):
                if key in layer and not number(layer[key]):
                    raise ValueError(f'素材参数 {key} 必须是有限数字')
            if any(layer.get(k, 1) <= 0 for k in ('scaleFrom', 'scaleTo')) or not 0 <= layer.get('opacity', 1) <= 1:
                raise ValueError('素材缩放必须为正数，透明度必须在 0–1')
            result[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    return result


def number(value):
    return type(value) in (int, float) and math.isfinite(value)


def boundary_frame(seconds, fps=30):
    # Match JavaScript Math.round for nonnegative time, including exact half frames.
    return math.floor(seconds * fps + 0.5)


def total_frames(duration, fps=30):
    # A duration created from N/fps must not gain a frame through floating-point noise.
    return math.ceil(duration * fps - 1e-8)


def frame_range(start, end, duration, fps=30):
    """Return a right-open absolute frame interval; final boundary includes the tail."""
    if not all(number(x) for x in (start, end, duration, fps)) or fps <= 0:
        raise ValueError('切片时间必须是有限数字')
    if not 0 <= start < end <= duration:
        raise ValueError('切片范围必须满足 0 ≤ start < end ≤ duration')
    a = boundary_frame(start, fps)
    b = total_frames(duration, fps) if end == duration else boundary_frame(end, fps)
    if a >= b:
        raise ValueError('切片不足一帧')
    return a, b


def plain_text(text):
    return re.sub(r'\{!?([^{}]+)\}', r'\1', text)


def transcript(text):
    return re.sub(r'[\W_]+', '', plain_text(text), flags=re.UNICODE)


def validate_motion(data, project, ready=True):
    """Return readable errors. Never follow user-supplied source paths."""
    errors = []
    if not isinstance(data, dict):
        return ['motion.json 必须是 JSON 对象']
    project = Path(project)
    if type(data.get('schema_version')) is not int or data['schema_version'] != 1:
        errors.append('schema_version 必须为 1')
    if data.get('renderer') != 'remotion' or data.get('theme') not in ('M01', 'M02', 'CUSTOM'):
        errors.append('renderer/theme 必须为 remotion 和 M01/M02')
    if type(data.get('draft')) is not bool:
        errors.append('draft 必须为布尔值')
    elif ready and data['draft']:
        errors.append('draft 工程尚未完成，补全分镜后设 draft=false')
    if any(type(data.get(k)) is not int or data[k] != v
           for k, v in {'width': 1080, 'height': 1920, 'fps': 30}.items()):
        errors.append('画幅必须为 1080×1920 / 30fps')
    duration = data.get('duration')
    if not number(duration) or duration <= 0:
        return errors + ['duration 必须是正的有限数字']
    for field in ('title', 'author'):
        if not isinstance(data.get(field), str) or not data[field].strip():
            errors.append(f'{field} 必须是非空文字')

    hashes = data.get('source_hashes')
    if not isinstance(hashes, dict):
        errors.append('source_hashes 必须为对象')
        hashes = {}
    if set(hashes) - set(SOURCE_FILES):
        errors.append('源文件路径只允许 script.json、audio/timings.json、audio/narration.wav')
    actual = source_hashes(project)
    if ready:
        for name in SOURCE_FILES:
            path = project / name
            if not path.is_file():
                errors.append(f'缺少源文件 {name}')
            elif not path.resolve().is_relative_to(project.resolve()):
                errors.append(f'源文件路径越界：{name}')
            elif hashes.get(name) != actual[name]:
                errors.append(f'{name} 已改变或缺少摘要，请重新排分镜后更新 source_hashes')
    if data.get('theme') == 'CUSTOM' and ready:
        visual = data.get('visual_direction')
        if not isinstance(visual, dict) or not all(isinstance(visual.get(k), str) and visual[k].strip() for k in ('style', 'palette', 'characters')):
            errors.append('CUSTOM 工程需填写 visual_direction 的 style、palette 和 characters')
    try:
        actual_assets = asset_hashes(project, data)
        if ready and actual_assets != data.get('asset_hashes', {}):
            errors.append('素材已改变或缺少摘要，请重新检查素材后更新 asset_hashes')
    except ValueError as exc:
        errors.append(str(exc))
    timing = {}
    if (project / 'audio/timings.json').is_file():
        try:
            timing = read_json(project / 'audio/timings.json')
            if not isinstance(timing, dict) or not number(timing.get('duration')):
                raise ValueError('duration 无效')
            if abs(timing['duration'] - duration) > 0.00001:
                errors.append('motion.duration 与 timings.json 不同')
            if not isinstance(timing.get('segments'), list):
                raise ValueError('segments 必须是列表')
            prev_end = 0
            ids = set()
            for item in timing['segments']:
                if not isinstance(item, dict) or not isinstance(item.get('id'), str) or item['id'] in ids:
                    raise ValueError('旁白段落 id 无效或重复')
                ids.add(item['id'])
                if not isinstance(item.get('text'), str) or not item['text'].strip():
                    raise ValueError('旁白 text 无效')
                a, b = item.get('start'), item.get('end')
                if not number(a) or not number(b) or not prev_end <= a < b <= duration + 0.00001:
                    raise ValueError('旁白段落时间无效或重叠')
                prev_end = b
        except (ValueError, TypeError, KeyError) as exc:
            errors.append(f'timings.json 无效：{exc}')
            timing = {}
    segment_ids = {s['id'] for s in timing.get('segments', [])}
    shots = data.get('shots')
    if not isinstance(shots, list) or not shots:
        errors.append('shots 必须是非空列表')
        shots = []
    previous, shot_ids = 0, set()
    for index, shot in enumerate(shots):
        label = f'shot[{index}]'
        if not isinstance(shot, dict):
            errors.append(f'{label} 必须是对象'); continue
        shot_id = shot.get('id')
        if not isinstance(shot_id, str) or not shot_id or shot_id in shot_ids:
            errors.append(f'{label} id 无效或重复')
        else:
            shot_ids.add(shot_id)
        start, end = shot.get('start'), shot.get('end')
        if not number(start) or not number(end) or not 0 <= start < end <= duration:
            errors.append(f'{label} 时间无效'); continue
        if abs(start - previous) > 0.00001:
            errors.append(f'{label} 镜头应连续覆盖全片，当前出现空隙或重叠')
        previous = end
        try:
            frame_range(start, end, duration)
        except ValueError as exc:
            errors.append(f'{label} {exc}')
        scene_type, props = shot.get('scene_type'), shot.get('scene_props')
        if not isinstance(scene_type, str) or scene_type not in SCENES:
            if ready or scene_type != 'unassigned':
                errors.append(f'{label} 未知场景 {scene_type}')
        elif scene_type in OIL_FULL_SCENES and data.get('theme') != 'M02':
            errors.append(f'{label} 场景 {scene_type} 仅支持 M02 厚涂油画主题')
        elif scene_type in TKAM_SCENES and data.get('theme') != 'M02':
            errors.append(f'{label} 场景 {scene_type} 仅支持 M02 厚涂油画主题')
        elif scene_type.startswith('mock_') and data.get('theme') != 'M01':
            errors.append(f'{label} 场景 {scene_type} 仅支持 M01 文学纸艺主题')
        elif not isinstance(props, dict) or not SCENES[scene_type].issubset(props):
            errors.append(f'{label} 缺少场景参数 {sorted(SCENES[scene_type])}')
        elif scene_type in ('corridor', 'goldfish'):
            if type(props['cycles']) is not int or not 1 <= props['cycles'] <= 3:
                errors.append(f'{label} cycles 必须为 1–3 的整数')
        elif scene_type == 'rain' and (not number(props['stop_at']) or not 0.1 <= props['stop_at'] <= 0.9):
            errors.append(f'{label} stop_at 必须在 0.1–0.9 之间')
        refs = shot.get('segment_ids')
        if not isinstance(refs, list) or any(not isinstance(x, str) for x in refs):
            errors.append(f'{label} segment_ids 必须为文字列表')
        elif ready and (not refs or not set(refs).issubset(segment_ids)):
            errors.append(f'{label} 关联了不存在的旁白段落')
        if ready:
            if shot.get('kind') not in ('原著场景', '情绪隐喻', '读者生活映射'):
                errors.append(f'{label} 画面性质无效')
            if not isinstance(shot.get('intent'), str) or not shot['intent'].strip():
                errors.append(f'{label} 缺少观众理解')
            if shot.get('kind') == '原著场景' and not str(shot.get('evidence', '')).strip():
                errors.append(f'{label} 原著场景必须有依据')
    if shots and abs(previous - duration) > 0.00001:
        errors.append('最后一镜未覆盖 duration')
    subtitles = data.get('subtitles')
    if not isinstance(subtitles, list) or (ready and not subtitles):
        errors.append('subtitles 必须为非空列表'); subtitles = []
    previous, spoken = 0, []
    for index, sub in enumerate(subtitles):
        label = f'subtitle[{index}]'
        if not isinstance(sub, dict):
            errors.append(f'{label} 必须为对象'); continue
        start, end, zh, en = sub.get('start'), sub.get('end'), sub.get('zh'), sub.get('en', '')
        if not number(start) or not number(end) or not previous <= start < end <= duration:
            errors.append(f'{label} 时间无效、重叠或越界')
        else:
            previous = end
            try:
                frame_range(start, end, duration)
            except ValueError as exc:
                errors.append(f'{label} {exc}')
        if not isinstance(zh, str) or not zh.strip():
            errors.append(f'{label} 中文不能为空'); continue
        text = plain_text(zh)
        spoken.append(text)
        lines = text.split('\n')
        if len(lines) > 2 or any(len(line) > 18 for line in lines):
            errors.append(f'{label} 中文最多两行，每行最多18字')
        if not isinstance(en, str) or (en and (len(lines) != 1 or len(en) > 60 or '\n' in en)):
            errors.append(f'{label} 英文只能配单行中文，且最多60字符')
    if ready and timing and transcript(''.join(spoken)) != transcript(''.join(s['text'] for s in timing['segments'])):
        errors.append('字幕可见文字与旁白原文不一致')
    for field in ('title_card', 'closing'):
        card = data.get(field)
        if card is not None:
            if not isinstance(card, dict):
                errors.append(f'{field} 必须为对象或 null')
            elif not number(card.get('start')) or not number(card.get('end')) or not 0 <= card['start'] < card['end'] <= duration:
                errors.append(f'{field} 起止时间无效')
            elif not isinstance(card.get('text'), str) or not card['text'].strip():
                errors.append(f'{field} 缺少 text')
    return errors


def load_motion(project, ready=True):
    return load_motion_snapshot(project, ready)[0]


def load_motion_snapshot(project, ready=True):
    payload = (Path(project) / 'motion.json').read_bytes()
    data = json.loads(payload.decode('utf-8-sig'))
    errors = validate_motion(data, project, ready)
    if errors:
        raise ValueError('\n'.join(errors))
    return data, hashlib.sha256(payload).hexdigest()


def assert_snapshot_current(project, fingerprint, data):
    current = hashlib.sha256((Path(project) / 'motion.json').read_bytes()).hexdigest()
    if current != fingerprint or source_hashes(project) != data['source_hashes'] or asset_hashes(project, data) != data.get('asset_hashes', {}):
        raise ValueError('渲染过程中分镜或旁白源发生变化，请重新渲染；不会为旧画面登记新摘要')


def renderer_fingerprint():
    root = Path(__file__).resolve().parents[1]
    files = sorted((root / 'remotion/src').rglob('*'))
    files += [root / p for p in ('remotion/package-lock.json', 'remotion/scripts/render.mjs',
        'engine/fonts/NotoSerifSC-VF.ttf', 'engine/fonts/CormorantGaramond.ttf',
        'engine/fonts/WenYue-HuiMoShouShu-J.otf')]
    result = hashlib.sha256()
    for path in files:
        if path.is_file():
            result.update(path.relative_to(root).as_posix().encode('utf-8'))
            result.update(path.read_bytes())
    return result.hexdigest()


def create_motion_project(project, script, force=False, theme='M01'):
    project = Path(project)
    if theme not in ('M01', 'M02', 'CUSTOM'):
        raise ValueError('未知 Remotion 主题；请选择 M01 文学纸艺或 M02 厚涂油画')
    if (project / 'motion.json').exists():
        raise ValueError('motion.json 已存在；请直接编辑，不用 --force 覆盖')
    if (project / 'film.js').exists() or (project / 'art-direction.json').exists():
        raise ValueError('已有 Canvas 工程，请另建 Remotion 工程目录')
    timing = read_json(project / 'audio/timings.json') if (project / 'audio/timings.json').is_file() else {}
    if not isinstance(timing, dict):
        raise ValueError('timings.json 必须为 JSON 对象')
    if 'segments' in timing and (not isinstance(timing['segments'], list) or any(
            not isinstance(s, dict) or not isinstance(s.get('id'), str) or not isinstance(s.get('text'), str)
            or not number(s.get('start')) or not number(s.get('end')) for s in timing['segments'])):
        raise ValueError('timings.json segments 必须是含 id/text/start/end 的有效旁白列表')
    duration = timing.get('duration', 60)
    if not number(duration) or duration <= 0:
        raise ValueError('timings.json duration 无效')
    value = {'schema_version': 1, 'renderer': 'remotion', 'theme': theme, 'draft': True,
        'title': script.get('book_title') or script.get('title') or '待填写书名', 'author': script.get('author') or '待填写作者',
        'width': 1080, 'height': 1920, 'fps': 30, 'duration': duration,
        'source_hashes': source_hashes(project),
        'shots': [{'id': 'shot-001', 'segment_ids': [s['id'] for s in timing.get('segments', [])],
                   'start': 0, 'end': duration, 'scene_type': 'unassigned', 'scene_props': {},
                   'kind': '情绪隐喻', 'evidence': '', 'intent': ''}],
        'subtitles': [{'start': s['start'], 'end': s['end'], 'zh': s['text']} for s in timing.get('segments', [])],
        'title_card': None, 'closing': None}
    if theme == 'CUSTOM':
        value['visual_direction'] = {'style': '', 'palette': '', 'characters': ''}
        value['asset_hashes'] = {}
    project.mkdir(parents=True, exist_ok=True)
    write_json(project / 'motion.json', value)
    if not (project / 'storyboard.md').exists():
        (project / 'storyboard.md').write_text(f'# {value["title"]} · Remotion 动态分镜\n\n'
            f'{theme} {"厚涂油画" if theme == "M02" else "文学纸艺" if theme == "M01" else "逐书设计"}；1080×1920 / 30fps；声音只有现有旁白。\n\n'
            '这是待补全的初稿。按真实旁白填写物体、动作、观众理解及原著依据，再完成 motion.json。\n', encoding='utf-8')
    return value
