# -*- coding: utf-8 -*-
"""Fish Audio 温暖男声旁白生成 + 时间轴。只出人声，不出配乐、不出音效。

  python scripts/make_voiceover.py <工程目录> --check           # 只验证 Key / 声音 / 额度
  python scripts/make_voiceover.py <工程目录> --only hook,case  # 先生成两段试听
  python scripts/make_voiceover.py <工程目录>                   # 全部 → audio/vo/*.mp3 + narration.wav + timings.json
  python scripts/make_voiceover.py <工程目录> --force           # 覆盖已生成的分段

声音与文案在 <工程>/script.json（voice.id + segments[{id,text,gap}]）。
Key 读环境变量 FISH_API_KEY，或工作区根目录 .env / 工程目录 .env（.env 已被 gitignore）。
timings.json 里每段的真实起止时刻就是分镜表和字幕的时间依据，片长 = duration。
"""
import argparse, json, os, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path
from media_tools import media_tool

import numpy as np

WORKSPACE = Path(__file__).resolve().parent.parent
ROOT = WORKSPACE
SR = 48000
API = "https://api.fish.audio/v1/tts"
LEAD = 0.35          # 第一句旁白从 0.35s 开始
TAIL = 2.0           # 最后一句结束后留 2s 给片名卡


def load_env():
    for env in (ROOT / ".env", WORKSPACE / ".env"):
        if not env.exists():
            continue
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def key():
    load_env()
    k = os.environ.get("FISH_API_KEY", "").strip()
    if not k:
        sys.exit(f"缺少 FISH_API_KEY：在 {WORKSPACE}/.env 写一行 FISH_API_KEY=...（.env 已被 gitignore）")
    return k


def post_tts(text, voice, model, speed=1.0, timeout=180):
    body = {
        "text": text,
        "reference_id": voice,
        "format": "mp3",
        "mp3_bitrate": 192,
        "chunk_length": 300,
        "normalize": True,
        "latency": "normal",
        "prosody": {"speed": speed},
    }
    req = urllib.request.Request(
        API,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key()}",
            "Content-Type": "application/json",
            "model": model,
        },
        method="POST",
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
                ct = r.headers.get("Content-Type", "")
            break
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:500]
            if e.code < 500 or attempt == 2:
                sys.exit(f"Fish Audio HTTP {e.code}: {detail}")
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            if attempt == 2:
                sys.exit(f"Fish Audio 网络错误：{e}")
        time.sleep(1.5 * (attempt + 1))
    else:
        sys.exit("Fish Audio 重试后仍无返回")
    if not data or len(data) < 2000:
        sys.exit(f"返回不像音频（{len(data)} bytes, {ct}）：{data[:300]!r}")
    return data


def decode(p, out_wav):
    subprocess.run(
        [media_tool("ffmpeg"), "-v", "error", "-y", "-i", str(p), "-ar", str(SR), "-ac", "2", str(out_wav)],
        check=True,
    )


def read_wav(p):
    import wave
    with wave.open(str(p), "rb") as w:
        assert w.getframerate() == SR and w.getnchannels() == 2
        x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768
    return x.reshape(-1, 2)


def write_wav(p, x):
    import wave
    x = np.clip(x, -1, 1)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def probe(p):
    r = subprocess.run(
        [media_tool("ffprobe"), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(p)],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


def main():
    global ROOT
    ap = argparse.ArgumentParser()
    ap.add_argument("project", help="工程目录，里面有 script.json")
    ap.add_argument("--only", default="")
    ap.add_argument("--voice", default="")
    ap.add_argument("--model", default="s2.1-pro-free")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--lead", type=float, default=LEAD)
    ap.add_argument("--tail", type=float, default=TAIL)
    ap.add_argument("--spec", default="script.json")
    ap.add_argument("--tag", default="")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    ROOT = Path(args.project).resolve()
    if not (ROOT / args.spec).exists():
        sys.exit(f"{ROOT / args.spec} 不存在：先把书评文案写进 script.json（格式见 references/storyboard.md）")
    spec = json.load(open(ROOT / args.spec, encoding="utf-8"))
    voice = args.voice or spec["voice"]["id"]
    segs = spec["segments"]
    only = set(x.strip() for x in args.only.split(",") if x.strip())

    if args.check:
        k = key(); print("key:", k[:6] + "…", f"({len(k)} chars)")
        print("voice:", spec["voice"]["name"], voice, "model:", args.model)
        data = post_tts("这是一次试音。", voice, args.model, args.speed)
        print("ok:", len(data), "bytes")
        return

    vo = ROOT / f"audio/vo{args.tag}"; vo.mkdir(parents=True, exist_ok=True)
    timings = []
    cursor = args.lead
    total = 0
    for s in segs:
        if only and s["id"] not in only:
            continue
        mp3 = vo / f'{s["id"]}.mp3'
        wav = vo / f'{s["id"]}.wav'
        if args.force or not mp3.exists() or mp3.stat().st_size < 2000:
            print("tts:", s["id"], "…", flush=True)
            mp3.write_bytes(post_tts(s["text"], voice, args.model, args.speed))
            time.sleep(0.4)
        if not wav.exists() or wav.stat().st_mtime < mp3.stat().st_mtime:
            decode(mp3, wav)
        dur = probe(wav)
        start = cursor
        end = start + dur
        timings.append({**s, "start": round(start, 3), "end": round(end, 3), "dur": round(dur, 3)})
        print(f'  {s["id"]:10s} {start:7.2f} → {end:7.2f}  ({dur:5.2f}s)  {s["text"].splitlines()[0]}')
        cursor = end + s["gap"]
        total = cursor

    if only:
        print("只生成了部分分段，未重搭时间轴。")
        return

    end = total + args.tail
    n = int(np.ceil(end * SR))
    track = np.zeros((n, 2), dtype=np.float32)
    for t in timings:
        x = read_wav(vo / f'{t["id"]}.wav')
        f = min(int(.012 * SR), len(x) // 2)
        if f:
            x[:f] *= np.linspace(0, 1, f)[:, None]
            x[-f:] *= np.linspace(1, 0, f)[:, None]
        i = int(round(t["start"] * SR))
        j = min(n, i + len(x))
        track[i:j] += x[:j - i]

    write_wav(ROOT / f"audio/narration{args.tag}.wav", track)
    peak = float(np.abs(track).max() or 1)
    db = 20 * np.log10(peak)
    print(f"narration: {end:.2f}s  peak {db:.1f} dBFS (混音时旁白目标 -16 LUFS，不在这里压)")
    out = {
        "voice": {**spec["voice"], "model": args.model, "speed": args.speed},
        "start_lead": args.lead,
        "tail": args.tail,
        "duration": round(end, 3),
        "segments": timings,
    }
    json.dump(out, open(ROOT / f"audio/timings{args.tag}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("timings:", ROOT / f"audio/timings{args.tag}.json")


if __name__ == "__main__":
    main()
