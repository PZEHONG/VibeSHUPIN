# -*- coding: utf-8 -*-
"""逐帧 seek → 截图 → 管道进 ffmpeg。画面是 t 的纯函数，所以可以只渲一段、只截几帧、乱序截。

  python render.py <工程>                       全片 → <工程>/renders/raw.mp4（无声）
  python render.py <工程> --jobs 4              全片，分 4 段并行渲再无损拼起来（长片用这个）
  python render.py <工程> --stills 2.5 8.5 21   只截几帧 → <工程>/review/s_0002.50.png
  python render.py <工程> --sheet 16            全片均匀取 16 帧拼一张 → review/sheet.jpg（开工后先看这个，再渲染）
  python render.py <工程> --sheet 3.5 9 21.5    指定时刻拼一张
  python render.py <工程> --motion 8.2 10.6     一段时间里均匀取 12 帧拼一张 → review/motion_8.2-10.6.jpg（看转场、看动作；后面可以再跟帧数）
  python render.py <工程> --clip 0 12 [名字]    只渲一段 → renders/<名字或_clip>.mp4
  python render.py <工程> --det                 确定性自检：同一批时刻乱序再截一遍，逐字节比
  python render.py <工程> --serve               起本地预览：浏览器开 http://127.0.0.1:8765/?play（←/→ 无，改完刷新）
  python render.py <工程> --size 1080x1920      手动指定画幅（一般不用：自动读 index.html 的 VK_SIZE）

本工作流只做「画面 + 温暖男声旁白」：渲染只出无声画面，人声由 scripts/make_voiceover.py 生成、
scripts/finalize.py 合成。不要配 BGM、不要音效事件（--events 已移除）。

工程目录里只需要 index.html + film.js。引擎（vk.js、vk-kit.js、fonts/）留在本文件所在目录，
由内置的小服务器挂到 /engine/ 下 —— 不用往每个工程里拷 40MB 字体，也没有 file:// 的跨目录字体限制。
"""
import base64, functools, hashlib, http.server, io, json, os, random, re, subprocess, sys, threading
from pathlib import Path
from urllib.parse import unquote

ENGINE = Path(__file__).resolve().parent
sys.path.insert(0, str(ENGINE.parent / "scripts"))
from media_tools import media_tool
SIZE = (1920, 1080)

def size_of(proj):
    """画幅以工程 index.html 里的 window.VK_SIZE 为准；没写就是 16:9。"""
    html = proj / "index.html"
    if html.exists():
        m = re.search(r"VK_SIZE\s*=\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]", html.read_text(encoding="utf-8"))
        if m: return int(m.group(1)), int(m.group(2))
    return SIZE

class Handler(http.server.SimpleHTTPRequestHandler):
    proj = None
    def translate_path(self, path):
        p = unquote(path.split("?", 1)[0].split("#", 1)[0])
        if p.startswith("/engine/"): return str(ENGINE / p[len("/engine/"):])
        return str(self.proj / p.lstrip("/")) if p != "/" else str(self.proj / "index.html")
    def do_GET(self):
        if self.path.startswith("/favicon"): self.send_response(204); self.end_headers(); return
        super().do_GET()
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
    def log_message(self, *a): pass

def serve(proj, port=0):
    h = type("H", (Handler,), {"proj": proj})
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}/"

def browser_options():
    """优先显式路径，再用Windows系统安装；其他平台沿用Chrome channel。"""
    configured = os.environ.get("VIBE_CHROME_PATH")
    if configured:
        return {"executable_path": configured}
    if sys.platform == "win32":
        for candidate in [Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
                          Path("C:/Program Files (x86)/Google/Chrome/Application/chrome.exe")]:
            if candidate.is_file():
                return {"executable_path": str(candidate)}
    return {"channel": "chrome"}

def open_page(p, url):
    # 关掉 LCD 次像素抗锯齿（跳着 seek 字边不抖）；每帧等合成器跑完再截；固定 sRGB
    b = p.chromium.launch(**browser_options(), args=["--disable-lcd-text", "--run-all-compositor-stages-before-draw", "--force-color-profile=srgb"])
    pg = b.new_page(viewport={"width": SIZE[0], "height": SIZE[1]}, device_scale_factor=1)
    pg.on("console", lambda m: m.type in ("error", "warning") and print("[page]", m.text))
    pg.on("pageerror", lambda e: print("[pageerror]", e))
    try:
        pg.goto(url)
        pg.wait_for_function("window.READY === true || !!window.LOAD_ERROR", timeout=180000)
        error = pg.evaluate("window.LOAD_ERROR || null")
        if error:
            raise RuntimeError(f"绘画素材加载失败：{error}")
        return b, pg
    except Exception:
        b.close()
        raise

def shot(pg, t):
    pg.evaluate(f"seek({t})")
    # PNG仍然无损；减少高纹理画面的压缩耗时，单页复用协议连接。
    session = getattr(pg, "_vibe_png_session", None)
    if session is None:
        session = pg.context.new_cdp_session(pg)
        pg._vibe_png_session = session
    result = session.send("Page.captureScreenshot", {
        "format": "png", "optimizeForSpeed": True,
        "captureBeyondViewport": False, "fromSurface": True,
    })
    return base64.b64decode(result["data"], validate=True)

def with_page(proj, fn):
    from playwright.sync_api import sync_playwright
    srv, url = serve(proj)
    try:
        with sync_playwright() as p:
            b, pg = open_page(p, url)
            try: return fn(pg)
            finally: b.close()
    finally: srv.shutdown()

def stills(proj, ts):
    (proj / "review").mkdir(exist_ok=True)
    def go(pg):
        for t in ts: (proj / f"review/s_{t:07.2f}.png").write_bytes(shot(pg, t))
    with_page(proj, go); print("stills:", len(ts))

def sheet(proj, args, name="sheet"):
    from PIL import Image, ImageDraw, ImageFont
    (proj / "review").mkdir(exist_ok=True)
    def go(pg):
        end = pg.evaluate("END")
        ts = [float(x) for x in args] if len(args) > 1 else [round((i + .5) * end / int(args[0] if args else 16), 2) for i in range(int(args[0] if args else 16))]
        cols = 4 if len(ts) > 6 else 2 if len(ts) > 1 else 1; tw = SIZE[0] // cols; th = round(tw * SIZE[1] / SIZE[0])
        out = Image.new("RGB", (cols * tw, -(-len(ts) // cols) * th), (20, 20, 20)); d = ImageDraw.Draw(out)
        try: font = ImageFont.truetype(str(ENGINE / "fonts/JetBrainsMono.ttf"), 18)
        except Exception: font = ImageFont.load_default()
        for i, t in enumerate(ts):
            im = Image.open(io.BytesIO(shot(pg, t))).convert("RGB").resize((tw, th), Image.LANCZOS)
            x, y = (i % cols) * tw, (i // cols) * th; out.paste(im, (x, y))
            d.rectangle([x, y + th - 24, x + 78, y + th], fill=(0, 0, 0)); d.text((x + 5, y + th - 22), f"{t:.2f}", font=font, fill=(255, 230, 0))   # 时间标在左下角，不挡左上的年份 / 章节标
        out.save(proj / f"review/{name}.jpg", quality=90); print("sheet:", proj / f"review/{name}.jpg", len(ts))
    with_page(proj, go)

def frames(proj, out, a=0.0, b=None):
    def go(pg):
        end, fps = pg.evaluate("END"), pg.evaluate("FPS")
        bb = end if b is None else min(b, end)
        ff = subprocess.Popen([media_tool("ffmpeg"), "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
                               "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "medium", "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
        n0, n1 = round(a * fps), round(bb * fps)
        for i in range(n0, n1):
            ff.stdin.write(shot(pg, i / fps))
            if (i - n0) % 150 == 0: print(f"  {i - n0}/{n1 - n0}", flush=True)
        ff.stdin.close(); ff.wait(); print("done", out, f"{bb - a:.2f}s")
    with_page(proj, go)

def frames_parallel(proj, out, jobs):
    """把全片切成 jobs 段，各开一个进程渲，再用 concat 无损拼接（每段编码参数相同、都从关键帧起）。"""
    end, fps = with_page(proj, lambda pg: (pg.evaluate("END"), pg.evaluate("FPS")))
    total = round(end * fps); cuts = [round(total * i / jobs) for i in range(jobs + 1)]
    parts, procs = [], []
    for i in range(jobs):
        name = f"_part{i:02d}"; parts.append(proj / f"renders/{name}.mp4")
        cmd = [sys.executable, str(Path(__file__).resolve()), str(proj), "--clip", repr(cuts[i] / fps), repr(cuts[i + 1] / fps), name]
        if SIZE != (1920, 1080): cmd += ["--size", f"{SIZE[0]}x{SIZE[1]}"]
        procs.append(subprocess.Popen(cmd, stdout=subprocess.DEVNULL if i else None))
    if any(p.wait() for p in procs): sys.exit("有一段渲染失败了，先单独跑 --clip 看报错")
    lst = proj / "renders/_parts.txt"; lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    subprocess.run([media_tool("ffmpeg"), "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", "-movflags", "+faststart", str(out)], check=True)
    for p in parts + [lst]: p.unlink()
    print("done", out, f"{end:.2f}s", f"({jobs} 路并行)")

def det(proj, n=12):
    def go(pg):
        end = pg.evaluate("END"); r = random.Random(7); ts = [round(r.uniform(0, end), 3) for _ in range(n)]
        h1 = {t: hashlib.md5(shot(pg, t)).hexdigest() for t in ts}
        order = ts[:]; r.shuffle(order)
        bad = [t for t in order if hashlib.md5(shot(pg, t)).hexdigest() != h1[t]]
        print("deterministic" if not bad else f"NOT deterministic at {bad} —— 有东西在跨帧存状态或用了 Math.random()")
    with_page(proj, go)

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    if "--size" in a:
        i = a.index("--size"); w, h = a[i + 1].lower().split("x"); SIZE = (int(w), int(h)); del a[i:i + 2]
    proj = Path(a[0]).resolve()
    if not (proj / "film.js").exists(): sys.exit(f"{proj} 里没有 film.js")
    SIZE = size_of(proj) if SIZE == (1920, 1080) else SIZE
    print(f"画幅 {SIZE[0]}×{SIZE[1]}")
    (proj / "renders").mkdir(exist_ok=True)
    if "--serve" in a:
        srv, url = serve(proj, 8765); print("预览:", url + "?play", "（Ctrl+C 结束）")
        try: threading.Event().wait()
        except KeyboardInterrupt: pass
    elif "--stills" in a: stills(proj, [float(x) for x in a[a.index("--stills") + 1:]])
    elif "--sheet" in a: sheet(proj, a[a.index("--sheet") + 1:])
    elif "--motion" in a:
        i = a.index("--motion"); t0, t1 = float(a[i + 1]), float(a[i + 2]); n = int(a[i + 3]) if len(a) > i + 3 else 12
        sheet(proj, [repr(round(t0 + (t1 - t0) * k / (n - 1), 3)) for k in range(n)], f"motion_{t0:g}-{t1:g}")
    elif "--clip" in a:
        i = a.index("--clip"); name = a[i + 3] if len(a) > i + 3 else "_clip"
        frames(proj, proj / f"renders/{name}.mp4", float(a[i + 1]), float(a[i + 2]))
    elif "--det" in a: det(proj)
    elif "--jobs" in a and int(a[a.index("--jobs") + 1]) > 1: frames_parallel(proj, proj / "renders/raw.mp4", int(a[a.index("--jobs") + 1]))
    else: frames(proj, proj / "renders/raw.mp4")
