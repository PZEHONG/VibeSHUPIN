"""七套书评画风的注册表、分镜验证与提示词；不调用付费绘图 API。"""
import json
import math
import re
from pathlib import Path, PureWindowsPath

ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "references/visual-styles.json"
KINDS = {"原著场景", "读者生活映射", "情绪隐喻"}
MOTIONS = {"none", "push", "pull", "pan-left", "pan-right"}
ROLES = {"hook", "title", "scene", "closing"}
ROLE_BRIEF = {
    "hook": "开场钩子：近景或中近景，人物背对或侧对镜头，脸可虚化；暗背景，一束明确主光；上方留出标题空间，第一眼就要有悬念。",
    "title": "书名卡镜头：主体退到画面下半部或虚化，顶部 y=120–520 保持干净留白，供后制叠加“今日分享／书名／作者”；本图不画任何文字。",
    "scene": "书摘链镜头：一镜只做一个动作，环境承担情绪；主体与关键物件落在 y=240–1380。",
    "closing": "落点镜头：画面安静、留白多，主光明确；主体可停下或离开，给最后一句字幕让出中下部空间。",
}
CINEMATIC = (
    "镜头语言（不改变画材）：单一主光源与明确光向；前、中、后景分层；浅景深；低饱和电影调色；"
    "细腻胶片颗粒与轻微暗角；同一主角跨镜保持年龄、发型、服装、体型一致，优先背影、侧影、手部与局部，不让角色直视镜头；"
    "环境承担情绪，不直译“孤独／自由／遗憾”等抽象词；一镜只发生一个动作。"
)


def registry():
    return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))


def select_style(explicit=None, script=None):
    data, script = registry(), script or {}
    choice = explicit if explicit is not None else script.get("visual_style")
    if choice is None:
        choice = data["review_styles"].get(script.get("review_style", script.get("style")), data["default"])
    if not isinstance(choice, str):
        raise ValueError("visual_style 必须是 S01–S07 的字符串")
    choice = choice.upper()
    if choice not in {*data["styles"], "B", "C"}:
        raise ValueError("画风只能是 S01–S07；B/C 仅用于兼容旧工程")
    return choice


def read_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8-sig"))


def write_json(p, value):
    Path(p).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def asset_path(project, relative):
    if not isinstance(relative, str) or not relative.strip():
        raise ValueError("image 必须填写工程内的相对素材路径")
    if ":" in relative or "\\" in relative or Path(relative).is_absolute() or PureWindowsPath(relative).is_absolute():
        raise ValueError("image 必须使用工程内相对路径与正斜杠")
    project = Path(project).resolve()
    target = (project / relative).resolve()
    if not target.is_relative_to(project):
        raise ValueError("素材不能越出工程目录")
    if target.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
        raise ValueError("素材必须为 PNG/JPEG/WebP 图片")
    return target


def finite_number(value):
    return isinstance(value, (float, int)) and not isinstance(value, bool) and math.isfinite(value)


def validate_art(art, project, ready=True, images=False):
    errors = []
    if not isinstance(art, dict):
        return ["绘画清单必须为 JSON 对象"]
    data = registry()
    if art.get("style") not in data["styles"]:
        errors.append("style 必须是 S01–S07")
    duration = art.get("duration")
    if not finite_number(duration) or duration <= 0:
        errors.append("duration 必须是正的有限秒数")
        duration = 0
    timing_path = Path(project) / "audio/timings.json"
    if timing_path.exists():
        try:
            actual_duration = read_json(timing_path)["duration"]
            if not finite_number(actual_duration) or abs(actual_duration - duration) > .05:
                errors.append("绘画清单片长与真实旁白不一致，请按timings.json重排镜头")
        except (ValueError, OSError, TypeError, KeyError) as exc:
            errors.append(f"真实旁白时间轴无法读取：{exc}")
    if art.get("schema_version") != 1:
        errors.append("schema_version 必须为 1")
    visual = art.get("visual")
    if not isinstance(visual, dict):
        errors.append("visual 必须为设定对象")
        visual = {}
    if ready:
        for field in ("characters", "era_location"):
            if not isinstance(visual.get(field), str) or not visual[field].strip():
                errors.append(f"visual.{field} 未填写（无人物时明确写无人物）")
        if art.get("style") == "S07":
            for field in ("motif", "color_script"):
                if not isinstance(visual.get(field), str) or not visual[field].strip():
                    errors.append(f"visual.{field} 未填写（S07 需要固定母题与色彩走向）")
    for field in ("color_script", "motif"):
        if field in visual and not isinstance(visual[field], str):
            errors.append(f"visual.{field} 必须为字符串")
    for key in ("title_card", "closing"):
        card = art.get(key)
        if card is None:
            continue
        if not isinstance(card, dict):
            errors.append(f"{key} 必须为对象")
            continue
        a, b = card.get("start"), card.get("end")
        if not all(finite_number(v) for v in (a, b)) or not (0 <= a < b <= duration):
            errors.append(f"{key} 的 start/end 必须落在片长内")
        label = card.get("title") or card.get("text")
        if not isinstance(label, str) or not label.strip():
            errors.append(f"{key} 缺少 title/text")
    shots = art.get("shots")
    if not isinstance(shots, list) or not shots:
        return errors + ["shots 必须至少包含一个镜头"]
    ids, previous = set(), -1
    for index, shot in enumerate(shots, 1):
        label = f"镜头{index}"
        if not isinstance(shot, dict):
            errors.append(f"{label} 必须为对象")
            continue
        identity = shot.get("id")
        if not isinstance(identity, str) or not identity or identity in ids:
            errors.append(f"{label} id 缺失或重复")
        else:
            ids.add(identity)
        a, b = shot.get("start"), shot.get("end")
        if not all(finite_number(v) for v in (a, b)):
            errors.append(f"{label} start/end 必须为有限秒数")
        elif not (0 <= a < b <= duration) or a < previous:
            errors.append(f"{label} 时间倒置、重叠或超出片长")
        else:
            previous = b
        motion = shot.get("motion", {})
        if not isinstance(motion, dict) or motion.get("type", "none") not in MOTIONS:
            errors.append(f"{label} motion.type 不支持")
        elif not finite_number(motion.get("amount", 0)) or not 0 <= motion.get("amount", 0) <= .08:
            errors.append(f"{label} motion.amount 必须为 0–0.08")
        if shot.get("role") is not None and shot["role"] not in ROLES:
            errors.append(f"{label} role 只能是 hook/title/scene/closing")
        try:
            target = asset_path(project, shot.get("image"))
            if images:
                if not target.is_file():
                    errors.append(f"{label} 素材缺失：{shot.get('image')}")
                else:
                    from PIL import Image
                    with Image.open(target) as image:
                        w, h = image.size
                        image.verify()
                    if w < 540 or h < 960 or abs((w / h) / (9 / 16) - 1) > .04:
                        errors.append(f"{label} 素材须为接近9:16的竖幅，至少540×960；实际{w}×{h}")
        except (ValueError, OSError) as exc:
            errors.append(f"{label} 素材：{exc}")
        if ready:
            for field in ("scene", "action", "emotion", "framing"):
                if not isinstance(shot.get(field), str) or not shot[field].strip():
                    errors.append(f"{label} {field} 未填写")
            if shot.get("kind") not in KINDS:
                errors.append(f"{label} kind 必须为原著场景／读者生活映射／情绪隐喻")
            if shot.get("kind") == "原著场景" and not str(shot.get("evidence", "")).strip():
                errors.append(f"{label} 原著场景必须填写 evidence")
        for field in ("narration", "evidence", "anchor"):
            if field in shot and not isinstance(shot[field], str):
                errors.append(f"{label} {field} 必须为字符串")
    return errors


def runtime_art(art):
    style = registry()["styles"][art["style"]]
    payload = {"schema_version": 1, "style": style, "duration": art["duration"],
               "title": art.get("title", ""), "shots": art["shots"],
               "title_card": art.get("title_card"), "closing": art.get("closing")}
    return payload


def make_prompt(art, shot):
    data = registry()
    style, visual = data["styles"][art["style"]], art["visual"]
    def value(v):
        return str(v).strip() or "待填写"
    truth = f"画面性质：{value(shot.get('kind', ''))}。"
    if shot.get("kind") != "原著场景":
        truth += "本画面是生活映射或情绪隐喻，不冒充原著情节。"
    references = shot.get("reference_images") or visual.get("references") or []
    role = shot.get("role") or "scene"
    return (
        f"单张9:16竖幅叙事画面，{style['name']}。{style['material']}\n"
        f"固定角色：{value(visual.get('characters', ''))}。时代地域：{value(visual.get('era_location', ''))}。\n"
        f"场景：{value(shot.get('scene', ''))}。动作：{value(shot.get('action', ''))}。"
        f"情绪：{value(shot.get('emotion', ''))}。景别与机位：{value(shot.get('framing', ''))}。\n"
        f"本镜任务：{ROLE_BRIEF.get(role, ROLE_BRIEF['scene'])}\n"
        f"本镜意象：{shot.get('anchor') or '不额外指定意象，以当前动作叙事'}。{truth}"
        f"依据：{shot.get('evidence') or '非原著场景'}。\n"
        f"全片母题：{visual.get('motif') or '未额外指定，沿用本书锚点'}；"
        f"色彩走向：{visual.get('color_script') or '按画风默认，全片保持同一主色与一处强调色'}。\n"
        f"{CINEMATIC}\n"
        f"参考图：{', '.join(map(str, references)) or '未提供；先出代表镜头，再复用该图'}。"
        "保持人物、道具、空间方向与画材一致。\n"
        "最终1080×1920；顶部 y=120–520 留给书名卡，保持干净；关键主体位于y=240–1380，面部和意象避开右侧按钮区；"
        "y=1400起降低纹理，字幕中心约1500、底边不超过1594，y≥1600只保留低信息背景。"
        "不画字幕底框与任何文字，预留轻微缩放裁切余量。"
        f"\n排除项：{data['negative']}"
    )


def export_art(art, project, draft=False):
    project = Path(project)
    payload = json.dumps(runtime_art(art), ensure_ascii=False, indent=2)
    (project / "art-direction.js").write_text("window.ART_DIRECTION = " + payload + ";\n", encoding="utf-8")
    story_path = project / "storyboard.md"
    if story_path.exists():
        story = story_path.read_text(encoding="utf-8")
        updated = re.sub(r"(画风[：:]\s*)S0[1-7]", lambda m: m.group(1) + art["style"], story, count=1)
        if updated != story:
            story_path.write_text(updated, encoding="utf-8")
    status = "草稿：先补全 art-direction.json，再运行 prepare_art.py" if draft else "可用于逐镜出图；图片由绘图工具生成"
    lines = [f"# {art['style']} {registry()['styles'][art['style']]['name']} · 绘画提示词",
             "", status, "", "声音只有温暖男声旁白，无伴奏、无音效、无第二音源。", ""]
    for shot in art["shots"]:
        lines += [f"## {shot['id']} · {shot['start']}–{shot['end']}s", "",
                  f"素材路径：{shot['image']}", "", make_prompt(art, shot), ""]
    (project / "art-prompts.md").write_text("\n".join(lines), encoding="utf-8")
