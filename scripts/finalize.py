# -*- coding: utf-8 -*-
"""把旁白合进无声画面，产出最终成片。

工程可在 motion.json 的 audio.bgm 声明一条原创背景音乐；未声明时只混合旁白。
旁白用 loudnorm 两遍法归一到目标响度，BGM 降到叙事垫乐电平并淡入淡出。

  python scripts/finalize.py <工程目录>                     # renders/raw.mp4 + 音频 → renders/final.mp4
  python scripts/finalize.py <工程目录> --out renders/x.mp4  # 另存一份
  python scripts/finalize.py <工程目录> --target -16         # 旁白响度目标 LUFS（默认 -16）
  python scripts/finalize.py <工程目录> --bgm-target -32     # BGM 响度目标 LUFS（默认 -32）
"""
import argparse, hashlib, json, re, subprocess, sys
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
    ap.add_argument("--bgm-target", type=float, default=-29.0)
    args = ap.parse_args()

    proj = Path(args.project).resolve()
    raw = proj / "renders/raw.mp4"
    narration = proj / "audio/narration.wav"
    out = Path(args.out).resolve() if args.out else proj / "renders/final.mp4"
    bgm = None
    motion = None

    if not raw.exists():
        renderer = "scripts/render_remotion.py" if (proj / "motion.json").exists() else "engine/render.py"
        sys.exit(f"没有 {raw}：先 python {renderer} {proj} 渲出无声画面")
    if not narration.exists():
        sys.exit(f"没有 {narration}：先 python scripts/make_voiceover.py {proj} 生成旁白")

    is_motion = (proj / "motion.json").is_file()
    if is_motion:
        from motion_project import load_motion, asset_hashes
        from motion_project import renderer_fingerprint
        from check_motion_film import digest
        try:
            motion = load_motion(proj)
            declared = (motion.get('audio') or {}).get('bgm')
            if declared:
                candidate = (proj / declared).resolve()
                if not candidate.is_relative_to(proj) or not candidate.is_file():
                    raise ValueError(f'audio.bgm 指向的音频不存在或越界：{declared}')
                bgm = candidate
            receipt = json.loads(raw.with_suffix('.render.json').read_text(encoding='utf-8'))
            motion_before, renderer_before = digest(proj / 'motion.json'), renderer_fingerprint()
            raw_before, narration_before = digest(raw), digest(narration)
            bgm_before = digest(bgm) if bgm else None
            assets_before = asset_hashes(proj, motion)
            if receipt.get('motion_sha256') != motion_before or receipt.get('output_sha256') != raw_before or receipt.get('renderer_sha256') != renderer_before:
                raise ValueError('无声画面与当前分镜不一致，请先重新渲染')
            info = subprocess.run([media_tool('ffprobe'), '-v', 'error', '-show_streams', '-of', 'json', str(raw)],
                                  capture_output=True, text=True, check=True)
            if any(s['codec_type'] == 'audio' for s in json.loads(info.stdout)['streams']):
                raise ValueError('raw.mp4 必须无音轨')
        except (ValueError, OSError, KeyError, TypeError) as exc:
            sys.exit(f'不能合成 Remotion 工程：{exc}')
    vd, ad = probe_duration(raw), probe_duration(narration)
    if abs(vd - ad) > 0.25:
        message = f"画面 {vd:.3f}s、旁白 {ad:.3f}s 不一致，请按 audio/timings.json 同步分镜片长。"
        if is_motion:
            sys.exit(message)
        print("警告：" + message)

    m = measure_loudness(narration)
    print(f"旁白原始响度 {m['input_i']} LUFS，真峰值 {m['input_tp']} dBTP → 归一到 {args.target} LUFS")
    voice = (f"loudnorm=I={args.target}:TP=-1.5:LRA=11:"
             f"measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
             f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:"
             f"offset={m['target_offset']}:linear=true:print_format=summary")
    inputs = ["-i", str(raw), "-i", str(narration)]
    if bgm:
        bd = probe_duration(bgm)
        if bd + .35 < ad:
            sys.exit(f"BGM {bd:.3f}s 短于旁白 {ad:.3f}s；请补足或裁到同一时间轴")
        bm = measure_loudness(bgm)
        gain = args.bgm_target - float(bm['input_i'])
        fade = max(0.0, ad - 10)
        print(f"BGM 原始响度 {bm['input_i']} LUFS → {args.bgm_target} LUFS（{gain:+.2f} dB），10s 淡出")
        graph = (f"[1:a]{voice}[voice];"
                 f"[2:a]volume={gain:.2f}dB,afade=t=in:st=0:d=5,"
                 f"afade=t=out:st={fade:.3f}:d=10[music];"
                 f"[voice][music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,"
                 f"alimiter=limit=0.89,aresample=48000[aout]")
        inputs += ["-i", str(bgm)]
    else:
        graph = f"[1:a]{voice},aresample=48000[aout]"

    out.parent.mkdir(parents=True, exist_ok=True)
    run([media_tool("ffmpeg"), "-v", "warning", "-y", *inputs,
         "-filter_complex", graph,
         "-map", "0:v:0", "-map", "[aout]",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-movflags", "+faststart", str(out)])
    if is_motion:
        from motion_project import write_json
        if (motion_before != digest(proj / 'motion.json') or renderer_before != renderer_fingerprint() or
                raw_before != digest(raw) or narration_before != digest(narration) or
                (bgm and bgm_before != digest(bgm)) or assets_before != asset_hashes(proj, motion)):
            sys.exit('合成过程中输入发生变化，请重新合成；不登记不一致来源。')
        write_json(out.with_suffix('.render.json'), {
            'motion_sha256': motion_before, 'renderer_sha256': renderer_before, 'output_sha256': digest(out),
            'raw_sha256': raw_before, 'narration_sha256': narration_before,
            'bgm_sha256': bgm_before,
            'audio_inputs': ['audio/narration.wav'] + ([Path(declared).as_posix()] if bgm else []),
            'normalization': ('two-pass loudnorm -16 LUFS; BGM -29 LUFS, 5s in / 10s out'
                              if bgm else 'two-pass loudnorm -16 LUFS')})
    print("成片：", out)
    print("下一步：python scripts/check_film.py", proj)


if __name__ == "__main__":
    main()
