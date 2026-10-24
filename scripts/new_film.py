# -*- coding: utf-8 -*-
"""建一个新的竖屏书评工程：
  python scripts/new_film.py <工程目录> --world S01–S06 [--force]
S01–S06：六套AI绘画外观，默认S01；C/B仅兼容旧工程。怎么选见 references/worlds.md。

S01–S06 工程带绘画清单、提示词和图片加载骨架；B/C保留旧骨架。
文案不同，屏上的东西就不同：每一镜照 storyboard.md 现写，不要从别的片子里搬画面。
若 <工程>/audio/timings.json 已存在（先配好音），骨架会带入片长和按旁白分段预填的字幕。
引擎留在工作区的 engine/ 里，由 engine/render.py 挂载；本工作流不依赖任何外部项目。

声音只有温暖男声旁白：骨架里没有 sfx，也不要加。配乐和音效一律禁止。
"""
import json, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORLD = {   # 外观名、theme、色板、这套外观的常驻元素（都在 vk-kit.js，用法见 references/engine.md）
    "B": ("B 寓言", "flat", "flat", "仪表 K.gauge、片名卡 K.titleGilt；场景自己画进 fr.look.under"),
    "C": ("C 夜曲", "night", "night", "章节标 K.chapterMark、片名卡 K.titleNight"),
}
SKELETON = """/* ★ 片名 · {name} · 竖屏 1080×1920 · 只有旁白，无配乐无音效
 * 这是骨架，一行画面都没有。每一镜照 storyboard.md 现写——文案不同，屏上的东西就不同。
 * 每个场景的函数头上先写一行：这是什么（日常的词）/ 它在干什么（一个动词）/ 观众明白了什么。
 * 事实和出处、哪些是示意，写在这段注释里。
 * 这套外观的常驻元素：{standing}。规格见 references/worlds.md，竖屏坐标见 references/vertical.md。 */
(function () {{
'use strict';
const {{ W, H, clamp, lerp, seg, smooth, ss, E, fade, hash, rng, rgba, mix }} = VK;
const K = VKit, P = K.PAL.{pal};

const INK = '#F8F9F8', SUB = '#EDE8DE', GOLD = '#F8D893', ROSE = '#E84B75', MUTE = '#879399';
const DUR = {dur};   // = audio/timings.json 的 duration，旁白多长片就多长

/* ---------- 时间：切点按旁白真实停顿（timings.json + 波形静音），不要平均切 ---------- */
const T = {{ end: DUR }};
const SUBS = [                                             // 一句字幕一行，和分镜表对着写；{{词}} 金色，{{!词}} 玫红
{subs}
];

/* ---------- 字幕：中下，底部约 18% 留给抖音 UI；规范见 references/vertical.md ---------- */
const SUB_Y = 1520;                    // 字幕块中心 ≈0.79×H；两行底边不得超过 0.83×H
function visLen(s) {{ return K.parseMark(s).length; }}
function subBackdrop(fr) {{
  const g = fr.grad(0, 1400, 0, H, [[0, '#010104', 0], [.26, '#010104', .40], [1, '#010104', .88]]);
  fr.rect(0, 1400, W, H - 1400, {{ fill: g }});
}}
function drawSubs(fr, t) {{
  for (const s of SUBS) {{
    if (t < s.a || t > s.b) continue;
    const k = Math.min(ss(t, s.a, s.a + .26), 1 - ss(t, s.b - .2, s.b));
    if (k <= .002) continue;
    const lines = s.zh.split('\\n');
    const long = lines.some(l => visLen(l) > 16);
    const size = long ? 42 : 46, lh = size * 1.42;
    const y0 = SUB_Y - (lines.length - 1) * lh / 2;
    lines.forEach((ln, i) => {{
      const cs = K.parseMark(ln), str = cs.map(c => c.ch).join('');
      fr.chars(str, W / 2, y0 + i * lh, {{
        font: 'serifr', size, track: size * .055, color: SUB, a: k,
        shadow: .85, shadowBlur: 18, shadowY: 3,
      }}, idx => {{
        const tone = cs[idx].tone;
        return tone ? {{ color: tone === 'red' ? ROSE : GOLD }} : null;
      }});
    }});
  }}
}}

/* 一个场景一个函数，自己管自己的进场和退场。 */
function scene1(fr, t) {{
}}

VK.film({{
  dur: T.end, theme: '{theme}', meta: {{ title: '' }},
  draw(fr, t) {{
    scene1(fr, t);
    subBackdrop(fr);
    drawSubs(fr, t);            // 字幕永远最后画，压在一切之上
  }},
}});
}})();
"""

def timings_subs(proj):
    """配过音的工程：拿真实片长和分段文案预填，省得手动对齐第一版。"""
    f = proj / "audio/timings.json"
    if not f.exists():
        return 60, "  // { a: 0.35, b: 4.2, zh: '……' },"
    data = json.loads(f.read_text(encoding="utf-8"))
    lines = []
    for s in data["segments"]:
        text = s["text"].replace("'", "\\'")
        lines.append(f"  {{ a: {s['start']:.2f}, b: {s['end']:.2f}, zh: '{text}' }},   // {s['id']}：按真实停顿再拆短")
    return data["duration"], "\n".join(lines)


def create_art_project(proj, style, script, force):
    from visual_styles import read_json, write_json, validate_art, export_art
    if (proj / "art-direction.json").exists():
        art = read_json(proj / "art-direction.json")
        art["style"] = style
    else:
        timing_path = proj / "audio/timings.json"
        timing = read_json(timing_path) if timing_path.exists() else None
        duration = timing["duration"] if timing else 60
        segments = timing.get("segments", []) if timing else []
        if not segments:
            segments = [{"id": "shot-001", "start": 0, "end": duration, "text": ""}]
        art = {
            "schema_version": 1, "style": style, "duration": duration,
            "title": script.get("book_title") or script.get("title") or proj.name,
            "visual": {"characters": "", "era_location": "", "anchors": [], "references": []},
            "shots": [
                {"id": f"shot-{i:03d}", "start": segment["start"], "end": segment["end"],
                 "narration": segment.get("text", ""), "kind": "", "evidence": "",
                 "scene": "", "action": "", "emotion": "", "framing": "中景", "anchor": "",
                 "image": f"assets/shot-{i:03d}.png", "reference_images": [],
                 "motion": {"type": "push", "amount": .025}}
                for i, segment in enumerate(segments, 1)
            ]
        }
    timing_path = proj / "audio/timings.json"
    if timing_path.exists() and abs(read_json(timing_path)["duration"] - art["duration"]) > .05:
        raise ValueError("已有绘画清单与真实旁白片长不同，请先调整 art-direction.json 的镜头时间")
    errors = validate_art(art, proj, ready=False)
    if errors:
        raise ValueError("\n".join(errors))
    subs = []
    if timing_path.exists():
        for s in read_json(timing_path)["segments"]:
            subs.append({"a": s["start"], "b": s["end"], "zh": s["text"]})
    film_template = (ROOT / "scripts/film_template.js").read_text(encoding="utf-8")
    film = film_template.replace("__DURATION__", json.dumps(art["duration"]))
    film = film.replace("__SUBS__", json.dumps(subs, ensure_ascii=False, indent=2))
    html = (ROOT / "engine/index.html").read_text(encoding="utf-8")
    html = html.replace('<script src="film.js"></script>',
                        '<script src="engine/art.js"></script>\n'
                        '<script src="art-direction.js"></script>\n<script src="film.js"></script>')
    proj.mkdir(parents=True, exist_ok=True)
    (proj / "assets").mkdir(exist_ok=True)
    (proj / "index.html").write_text(html, encoding="utf-8")
    (proj / "film.js").write_text(film, encoding="utf-8")
    write_json(proj / "art-direction.json", art)
    export_art(art, proj, draft=True)
    if not (proj / "storyboard.md").exists():
        rows = [
            f"# {art['title']} · 分镜表", "", f"画风：{style}；1080×1920 / 30fps",
            "", "成片只有温暖男声旁白，无配乐无音效。下表是初稿，补全后才出图。", "",
            "| 镜头 | 真实时间 | 旁白 | 画面／动作 | 观众明白什么 | 画面性质与依据 | 素材 |",
            "|---|---|---|---|---|---|---|",
        ]
        for shot in art["shots"]:
            text = shot["narration"].replace("|", "／").replace("\n", " ")
            rows.append(f"| {shot['id']} | {shot['start']}–{shot['end']} | {text} | 待填写 | 待填写 | 待确认 | {shot['image']} |")
        rows += ["", "## 事实", "", "逐条写明出处；不编造原著引文与情节。", "",
                 "## 示意", "", "逐镜标明生活映射或情绪隐喻，不当成原著场景。", "",
                 "## 视觉设定", "", "在 art-direction.json 补全角色、时代地域、锚点和参考图。", ""]
        (proj / "storyboard.md").write_text("\n".join(rows), encoding="utf-8")
    return art


def main():
    import argparse
    from visual_styles import select_style, read_json
    parser = argparse.ArgumentParser(description="建9:16书评工程：S01–S06，B/C兼容旧工程")
    parser.add_argument("project")
    parser.add_argument("--world", help="S01–S06；省略时读script.json，最终默认S01")
    parser.add_argument("--force", action="store_true", help="重建film.js；保留分镜表和绘画清单内容")
    args = parser.parse_args()
    proj = Path(args.project).resolve()
    try:
        script = read_json(proj / "script.json") if (proj / "script.json").exists() else {}
        if not isinstance(script, dict):
            raise ValueError("script.json 必须为JSON对象")
        if args.world is None and args.force and not script.get("visual_style") and (proj / "art-direction.json").exists():
            script = {**script, "visual_style": read_json(proj / "art-direction.json").get("style")}
        style = select_style(args.world, script)
        if (proj / "film.js").exists() and not args.force:
            raise ValueError("film.js 已经存在；重建需显式 --force，不会覆盖已有分镜表")
        if style in WORLD:
            if (proj / "art-direction.json").exists():
                raise ValueError("已有六套画风清单；兼容B/C请使用新工程目录")
            name, theme, pal, standing = WORLD[style]
            dur, sub_lines = timings_subs(proj)
            film = SKELETON.format(name=name, theme=theme, subs=sub_lines, pal=pal, standing=standing, dur=dur)
            proj.mkdir(parents=True, exist_ok=True)
            shutil.copy(ROOT / "engine/index.html", proj / "index.html")
            (proj / "film.js").write_text(film, encoding="utf-8", newline="\n")
        else:
            art = create_art_project(proj, style, script, args.force)
            print(f"{style} · 绘画清单与提示词已生成，片长{art['duration']}s。")
            print("下一步：补全 art-direction.json → prepare_art.py → 按提示词逐镜出图到 assets/。")
        print(f"工程：{proj}；图片准备好后运行 engine/render.py 预览与渲染。")
    except (ValueError, OSError, KeyError, TypeError) as exc:
        print(f"建工程失败：{exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
