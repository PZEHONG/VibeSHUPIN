# -*- coding: utf-8 -*-
"""竖屏书评成片终检：能自动查的都查，查不了的列成人工清单。

  python scripts/check_film.py <工程目录>              # 查 renders/final.mp4
  python scripts/check_film.py <工程目录> --json       # 机器可读
  python scripts/check_film.py <工程目录> --no-audio   # 只查工程和无声画面（还没配音合成时）

硬约束：1080×1920 / 30fps；只有一路音频且来自 audio/narration.wav；禁止 BGM、音效、第二音源；
字幕中下（SUB_Y ≈0.79×H），底部约 18% 留给抖音 UI。任何一条不过，退出码 1。
"""
import argparse, json, re, subprocess, sys
from pathlib import Path
from media_tools import media_tool

H = 1920
FORBIDDEN = [
    (r"\bsfx\s*\(", "音效事件 sfx（本工作流禁止任何音效）"),
    (r"\bbgm\b", "BGM 配乐（本工作流禁止伴奏）"),
    (r"\bscore\b", "配乐 score"),
    (r"\bnew\s+Audio\b|<audio|\baudio\s*\(", "在画面里播放音频"),
    (r"\bevents\s*\(", "音效事件表 events"),
    (r"make_bgm|audio\.py|--bgm", "配乐合成脚本"),
]
AUDIO_OK = re.compile(r"^(narration.*\.wav|timings.*\.json)$", re.I)


def probe(p):
    r = subprocess.run([media_tool("ffprobe"), "-v", "error", "-show_streams", "-show_format", "-of", "json", str(p)],
                       capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def loudness(p):
    r = subprocess.run([media_tool("ffmpeg"), "-v", "info", "-i", str(p), "-af", "loudnorm=print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"\{[^{}]*input_i[^{}]*\}", r.stderr, re.S)
    return json.loads(m[-1]) if m else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--no-audio", action="store_true")
    args = ap.parse_args()
    proj = Path(args.project).resolve()
    results = []

    def check(name, ok, detail="", warn=False):
        results.append({"name": name, "status": "PASS" if ok else "WARN" if warn else "FAIL", "detail": detail})

    film_path = proj / "film.js"
    html_path = proj / "index.html"
    film = film_path.read_text(encoding="utf-8") if film_path.exists() else ""
    html = html_path.read_text(encoding="utf-8") if html_path.exists() else ""

    check("工程文件 film.js / index.html / storyboard.md",
          film_path.exists() and html_path.exists() and (proj / "storyboard.md").exists(),
          "缺哪一个补哪一个")


    # 新画风工程必须带完整清单；旧 B/C 工程不强行迁移。
    art_path = proj / "art-direction.json"
    uses_art = art_path.exists() or "art-direction.js" in html or "ART_DIRECTION" in film
    if uses_art:
        from visual_styles import read_json, validate_art, runtime_art
        try:
            art = read_json(art_path)
            art_errors = validate_art(art, proj, images=True)
            check("六套画风分镜与素材完整（含竖幅尺寸）", not art_errors, "；".join(art_errors[:12]))
            manifest_js = (proj / "art-direction.js").read_text(encoding="utf-8")
            prefix, suffix = "window.ART_DIRECTION = ", ";\n"
            payload = json.loads(manifest_js.removeprefix(prefix).removesuffix(suffix))
            consistent = payload == runtime_art(art)
            check("画风与浏览器清单一致", consistent, "修改art-direction.json后重新运行prepare_art.py")
            mdur_art = re.search(r"\bDUR\s*=\s*([\d.]+)", film)
            check("绘画清单片长与film.js一致", bool(mdur_art) and
                  abs(float(mdur_art.group(1)) - art["duration"]) < .05,
                  "旁白重配后同步调整镜头、DUR与清单")
            timing_path = proj / "audio/timings.json"
            if timing_path.exists():
                check("绘画清单片长与真实旁白一致",
                      abs(read_json(timing_path)["duration"] - art["duration"]) < .05,
                      "请按真实旁白重排绘画分镜")
        except (ValueError, OSError, KeyError, TypeError) as exc:
            check("六套画风分镜与素材清单可读取", False, str(exc))

    m = re.search(r"VK_SIZE\s*=\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]", html)
    check("画幅声明 window.VK_SIZE=[1080,1920]", bool(m) and (m.group(1), m.group(2)) == ("1080", "1920"),
          "index.html 里引擎加载之前写 window.VK_SIZE=[1080,1920]")

    bad = []
    for pat, why in FORBIDDEN:
        for i, line in enumerate(film.splitlines(), 1):
            code = line.split("//")[0]
            if re.search(pat, code, re.I):
                bad.append(f"film.js:{i} {why} → {line.strip()[:80]}")
    check("画面里没有配乐 / 音效 / 音频播放", not bad, "\n".join(bad))

    audio_dir = proj / "audio"
    stray = []
    if audio_dir.exists():
        for p in audio_dir.rglob("*"):
            if p.is_file() and p.suffix.lower() in (".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg"):
                if p.parent.name.startswith("vo") or AUDIO_OK.match(p.name):
                    continue
                stray.append(str(p.relative_to(proj)))
    check("audio/ 里只有旁白（narration*.wav + vo/ 分段）", not stray,
          "多出来的音频素材：" + "、".join(stray) + "。配乐和音效一律删除，不进成片")

    timings = proj / "audio/timings.json"
    dur = None
    if timings.exists():
        dur = json.loads(timings.read_text(encoding="utf-8"))["duration"]
        mdur = re.search(r"\bDUR\s*=\s*([\d.]+)", film)
        check("片长 DUR = timings.json 的 duration",
              bool(mdur) and abs(float(mdur.group(1)) - dur) < 0.05,
              f"timings duration={dur}，film.js DUR={mdur.group(1) if mdur else '没写'}")
    elif not args.no_audio:
        check("audio/timings.json 存在", False, "先跑 scripts/make_voiceover.py")

    # 新模板使用 JSON 安全序列化，保留旧工程的单引号对象兼容。
    json_subs = re.search(r"\bconst\s+SUBS\s*=\s*(\[[\s\S]*?\]);", film)
    subs = None
    if json_subs:
        try:
            values = json.loads(json_subs.group(1))
            subs = [(s["a"], s["b"], s["zh"]) for s in values]
        except (ValueError, KeyError, TypeError):
            pass
    if subs is None:
        subs = re.findall(r"\{\s*a:\s*([\d.]+),\s*b:\s*([\d.]+),\s*zh:\s*'((?:[^'\\]|\\.)*)'", film)

    check("字幕条目 SUBS 非空", len(subs) > 0, f"共 {len(subs)} 条")
    problems, prev_b = [], 0.0
    for a, b, zh in subs:
        a, b = float(a), float(b)
        if b <= a: problems.append(f"{a}–{b} 起止反了")
        if a < prev_b - 0.02: problems.append(f"{a} 与上一条重叠")
        if dur and b > dur + 0.05: problems.append(f"{b} 超出片长 {dur}")
        for ln in zh.replace("\\n", "\n").split("\n"):
            visible = len(re.sub(r"\{!?", "", ln).replace("}", ""))
            if visible > 18: problems.append(f"「{ln[:20]}」{visible} 字，一行太长")
        if zh.replace("\\n", "\n").count("\n") > 1: problems.append(f"「{zh[:16]}」超过两行")
        prev_b = b
    check("字幕逐条合法（顺序 / 不重叠 / 不超片长 / 一行≤18字 / 最多两行）", not problems, "；".join(problems[:8]))

    my = re.search(r"\bSUB_Y\s*=\s*([\d.]+)", film)
    if my:
        y = float(my.group(1))
        bottom = y + 46 * 1.42 / 2 + 46 * 0.38      # 两行字幕的估算底边
        check("字幕在中下、不贴底（SUB_Y≈0.79H，两行底边≤0.83H）",
              0.74 * H <= y <= 0.82 * H and bottom <= 0.83 * H,
              f"SUB_Y={y}，两行底边估算 {bottom:.0f}/{H}（底部 18% 是抖音 UI 区）")
    else:
        check("字幕位置收成 SUB_Y 常量", False, "不要每行字幕各写各的 y")

    final = proj / "renders/final.mp4"
    if not args.no_audio:
        if not final.exists():
            check("renders/final.mp4 存在", False, "先跑 scripts/finalize.py")
        else:
            info = probe(final)
            v = [s for s in info["streams"] if s["codec_type"] == "video"]
            au = [s for s in info["streams"] if s["codec_type"] == "audio"]
            check("只有一路视频、一路音频（旁白），没有第二音源", len(v) == 1 and len(au) == 1,
                  f"video={len(v)} audio={len(au)}")
            if v:
                check("1080×1920 / 30fps / h264",
                      v[0]["width"] == 1080 and v[0]["height"] == 1920 and v[0]["r_frame_rate"] == "30/1"
                      and v[0]["codec_name"] == "h264",
                      f"{v[0]['width']}×{v[0]['height']} {v[0]['r_frame_rate']} {v[0]['codec_name']}")
                if dur:
                    check("视频时长与旁白时间轴一致", abs(float(info["format"]["duration"]) - dur) < 0.35,
                          f"成片 {info['format']['duration']}s / timings {dur}s")
            narration = proj / "audio/narration.wav"
            if narration.exists() and au:
                nd = float(probe(narration)["format"]["duration"])
                ad = float(au[0].get("duration", info["format"]["duration"]))
                check("音轨长度 = 旁白长度（没有别的声音被混进来）", abs(nd - ad) < 0.35,
                      f"旁白 {nd:.3f}s / 成片音轨 {ad:.3f}s")
            lm = loudness(final)
            if lm:
                i, tp = float(lm["input_i"]), float(lm["input_tp"])
                check("旁白响度约 -16 LUFS、真峰值≤-1 dBTP", abs(i + 16) <= 1.5 and tp <= -1.0,
                      f"实测 {i} LUFS / {tp} dBTP（用 finalize.py 的 --target 调整）", warn=True)

    manual = [
        "静音、遮住字幕看一遍：每镜答得出「这是什么 / 它在干什么 / 我明白了什么」",
        "只读字幕一遍：通顺，名词在屏上找得到，和旁白逐句对得上",
        "成片完整看一遍（不是只看拼图）：没有硬切、没有东西伸进底部 UI 区",
        "事实：书名、作者、人物、年份与 storyboard.md 的事实表一致；示意的地方写明了",
        "听一遍：只有温暖男声旁白，没有配乐、没有音效、没有水印和署名",
    ]

    if args.json:
        print(json.dumps({"project": str(proj), "results": results, "manual": manual}, ensure_ascii=False, indent=1))
    else:
        for r in results:
            print(f"[{r['status']}] {r['name']}" + (f"\n       {r['detail']}" if r["detail"] and r["status"] != "PASS" else ""))
        print("\n人工终检（脚本查不了，必须真看真听）：")
        for i, s in enumerate(manual, 1):
            print(f"  {i}. {s}")
    sys.exit(1 if any(r["status"] == "FAIL" for r in results) else 0)


if __name__ == "__main__":
    main()
