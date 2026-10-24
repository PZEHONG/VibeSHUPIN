# -*- coding: utf-8 -*-
"""建一个新的竖屏书评工程：
  python scripts/new_film.py <工程目录> --world C|B [--force]
C 夜曲（夜里的一盏灯、纸、剪影；克制、文学感）· B 寓言（扁平插画、生活场景）。怎么选见 references/worlds.md。

工程里是 9:16 的 index.html 和一份只能跑起来的 film.js 骨架——里面一行画面都没有。
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

if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 1 or a[0].startswith("-"): sys.exit(__doc__)
    proj = Path(a[0]).resolve(); world = (a[a.index("--world") + 1] if "--world" in a else "C").upper()
    if world not in WORLD: sys.exit("--world 只能是 C 或 B")
    proj.mkdir(parents=True, exist_ok=True)
    film = proj / "film.js"
    if film.exists() and "--force" not in a: sys.exit(f"{film} 已经存在。要覆盖加 --force")
    name, theme, pal, standing = WORLD[world]
    dur, sub_lines = timings_subs(proj)
    shutil.copy(ROOT / "engine/index.html", proj / "index.html")
    film.write_text(SKELETON.format(name=name, theme=theme, subs=sub_lines, pal=pal, standing=standing, dur=dur), encoding="utf-8", newline="\n")
    render = ROOT / "engine/render.py"
    print(f"建好了：{proj}（{name}，1080×1920，片长 {dur}s）\n"
          f"  预览  python \"{render}\" \"{proj}\" --serve\n"
          f"  拼图  python \"{render}\" \"{proj}\" --sheet 16\n"
          f"  渲染  python \"{render}\" \"{proj}\" --jobs 4\n"
          f"  合成  python \"{ROOT / 'scripts/finalize.py'}\" \"{proj}\"\n"
          f"  终检  python \"{ROOT / 'scripts/check_film.py'}\" \"{proj}\"\n"
          f"下一步：film.js 里现在一行画面都没有。照 storyboard.md，从最难画的那一镜写起。")
