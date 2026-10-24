# -*- coding: utf-8 -*-
"""把温暖男声旁白合进无声画面，产出最终成片。只接受旁白一路音频，没有 BGM、没有音效、没有第二个音源。

  python scripts/finalize.py <工程目录>                     # renders/raw.mp4 + audio/narration.wav → renders/final.mp4
  python scripts/finalize.py <工程目录> --out renders/x.mp4  # 另存一份
  python scripts/finalize.py <工程目录> --target -16         # 旁白响度目标 LUFS（默认 -16）

响度用 loudnorm 两遍法：先量，再线性归一到目标，避免单遍动态压缩把朗读的呼吸感压没。
"""
import argparse, json, re, subprocess, sys
from pathlib import Path
from media_tools import media_tool


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, **kw)


def probe_duration(p):
    r = subprocess.run([media_tool("ffprobe"), "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(p)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def measure_loudness(p):
    r = subprocess.run([media_tool("ffmpeg"), "-v", "info", "-i", str(p), "-af", "loudnorm=print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    m = re.findall(r"\{[^{}]*input_i[^{}]*\}", r.stderr, re.S)
    if not m:
        sys.exit("量不到旁白响度，ffmpeg 输出：\n" + r.stderr[-2000:])
    return json.loads(m[-1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--out", default="")
    ap.add_argument("--target", type=float, default=-16.0)
    args = ap.parse_args()

    proj = Path(args.project).resolve()
    raw = proj / "renders/raw.mp4"
    narration = proj / "audio/narration.wav"
    out = Path(args.out).resolve() if args.out else proj / "renders/final.mp4"

    if not raw.exists():
        sys.exit(f"没有 {raw}：先 python engine/render.py {proj} --jobs 4 渲出无声画面")
    if not narration.exists():
        sys.exit(f"没有 {narration}：先 python scripts/make_voiceover.py {proj} 生成旁白")

    vd, ad = probe_duration(raw), probe_duration(narration)
    if abs(vd - ad) > 0.25:
        print(f"警告：画面 {vd:.3f}s、旁白 {ad:.3f}s 不一致。film.js 的 DUR 应等于 audio/timings.json 的 duration。")

    m = measure_loudness(narration)
    print(f"旁白原始响度 {m['input_i']} LUFS，真峰值 {m['input_tp']} dBTP → 归一到 {args.target} LUFS")
    af = (f"loudnorm=I={args.target}:TP=-1.5:LRA=11:"
          f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:"
          f"offset={m['target_offset']}:linear=true:print_format=summary")

    out.parent.mkdir(parents=True, exist_ok=True)
    # 只有两个输入：无声画面、旁白。任何配乐/音效都没有进入这条命令的入口。
    run([media_tool("ffmpeg"), "-v", "warning", "-y",
         "-i", str(raw), "-i", str(narration),
         "-map", "0:v:0", "-map", "1:a:0",
         "-c:v", "copy", "-af", af, "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-movflags", "+faststart", str(out)])
    print("成片：", out)
    print("下一步：python scripts/check_film.py", proj)


if __name__ == "__main__":
    main()
