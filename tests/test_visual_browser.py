import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ENV = {**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"}
spec = importlib.util.spec_from_file_location("render_engine", ROOT / "engine/render.py")
render = importlib.util.module_from_spec(spec)
spec.loader.exec_module(render)


class BrowserWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="vibe-browser-")
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)

    def command(self, script, project, *args):
        result = subprocess.run([sys.executable, str(ROOT / "scripts" / script), str(project), *args],
                                capture_output=True, text=True, encoding="utf-8", env=ENV)
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        return result

    def fixture(self, style, image=True, filename="assets/shot-001.png"):
        project = self.base / style
        (project / "audio").mkdir(parents=True)
        (project / "audio/timings.json").write_text(json.dumps({
            "duration": 3, "segments": [{"id": "hook", "start": .35, "end": 2,
                                        "text": "慢一点，\n也会到达。"}]
        }), encoding="utf-8")
        self.command("new_film.py", project, "--world", style)
        art = json.loads((project / "art-direction.json").read_text(encoding="utf-8"))
        art["visual"].update(characters="成年短发女性", era_location="现代居室")
        art["shots"][0].update(kind="读者生活映射", scene="窗边", action="放下书", emotion="平静",
                               framing="中景", image=filename)
        (project / "art-direction.json").write_text(json.dumps(art, ensure_ascii=False), encoding="utf-8")
        self.command("prepare_art.py", project)
        if image:
            img = Image.new("RGB", (1080, 1920), "#7593A5")
            draw = ImageDraw.Draw(img)
            draw.rectangle((200, 400, 800, 1100), fill="#AB7654")
            img.save(project / filename)
        return project

    def test_all_styles_load_images_and_render_deterministically(self):
        render.SIZE = (1080, 1920)
        with sync_playwright() as p:
            browser = p.chromium.launch(**render.browser_options(), args=["--force-color-profile=srgb"])
            try:
                for i in range(1, 7):
                    style = f"S{i:02d}"
                    with self.subTest(style=style):
                        filename = "assets/窗边 图 #1.png" if i == 6 else "assets/shot-001.png"
                        project = self.fixture(style, filename=filename)
                        self.command("prepare_art.py", project, "--check-images")
                        checked = self.command("check_film.py", project, "--no-audio", "--json")
                        self.assertFalse(any(r["status"] == "FAIL" for r in json.loads(checked.stdout)["results"]))
                        server, url = render.serve(project)
                        page = browser.new_page(viewport={"width": 1080, "height": 1920})
                        try:
                            page.goto(url)
                            page.wait_for_function("window.READY === true || !!window.LOAD_ERROR", timeout=15000)
                            self.assertFalse(page.evaluate("window.LOAD_ERROR || null"))
                            self.assertEqual(page.evaluate("window.META.visual_style"), style)
                            page.evaluate("seek(1)")
                            first = page.screenshot(type="png")
                            page.evaluate("seek(2.8); seek(1)")
                            self.assertEqual(hashlib.sha256(first).digest(),
                                             hashlib.sha256(page.screenshot(type="png")).digest())
                            pixel = Image.open(io.BytesIO(first)).convert("RGB").getpixel((500, 600))
                            self.assertLess(max(abs(a-b) for a, b in zip(pixel, (171, 118, 84))), 15)
                        finally:
                            page.close()
                            server.shutdown()
                            server.server_close()
            finally:
                browser.close()

    def test_shot_preserves_pixels_and_captures_current_frame_after_random_seek(self):
        project = self.fixture("S06")
        render.SIZE = (1080, 1920)
        def inspect(page):
            times = [.4, 1.0, 2.7]
            references = {}
            for t in times:
                page.evaluate(f"seek({t})")
                references[t] = Image.open(io.BytesIO(page.screenshot(type="png"))).convert("RGBA").tobytes()
            for t in reversed(times):
                frame = Image.open(io.BytesIO(render.shot(page, t))).convert("RGBA")
                self.assertEqual(frame.size, (1080, 1920))
                self.assertEqual(frame.tobytes(), references[t], f"错误时间或有损截图：{t}s")
        render.with_page(project, inspect)

    def test_render_cli_exports_vertical_h264_without_audio(self):
        project = self.fixture("S04")
        result = subprocess.run([sys.executable, str(ROOT / "engine/render.py"), str(project),
                                 "--clip", "0", "0.2", "smoke"], capture_output=True,
                                text=True, encoding="utf-8", env=ENV, timeout=25)
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        info = subprocess.run([render.media_tool("ffprobe"), "-v", "error", "-show_streams", "-of", "json",
                               str(project / "renders/smoke.mp4")], capture_output=True,
                              text=True, check=True)
        streams = json.loads(info.stdout)["streams"]
        self.assertEqual(len(streams), 1)
        video = streams[0]
        self.assertEqual((video["codec_name"], video["width"], video["height"], video["r_frame_rate"]),
                         ("h264", 1080, 1920, "30/1"))

    def test_renderer_reports_missing_image_without_long_timeout(self):
        project = self.fixture("S01", image=False)
        code = (
            "import sys;from pathlib import Path;"
            f"sys.path.insert(0,{str(ROOT / 'engine')!r});import render;"
            "render.SIZE=(1080,1920);"
            f"render.with_page(Path({str(project)!r}),lambda page: None)"
        )
        try:
            result = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True,
                                    encoding="utf-8", env=ENV, timeout=12)
        except subprocess.TimeoutExpired:
            self.fail("缺图应快速报错，不应等待180秒")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("素材", result.stderr + result.stdout)


if __name__ == "__main__":
    unittest.main()
