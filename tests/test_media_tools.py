import importlib.util
import os
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class MediaToolTests(unittest.TestCase):
    def test_skips_empty_path_stub_and_finds_valid_installed_tool(self):
        spec = importlib.util.spec_from_file_location("media_tools", ROOT / "scripts/media_tools.py")
        self.assertTrue(Path(spec.origin).exists(), "编码器查找必须跳过空占位文件")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory(prefix="vibe-media-") as directory:
            base = Path(directory)
            for name in ["first", "second"]:
                (base / name).mkdir()
            tool = "ffmpeg.exe" if os.name == "nt" else "ffmpeg"
            (base / "first" / tool).write_bytes(b"")
            valid = base / "second" / tool
            valid.write_bytes(b"MZfake-nonempty-for-path-resolution")
            if os.name != "nt":
                valid.chmod(0o755)
                (base / "first" / tool).chmod(0o755)
            original_path = os.environ["PATH"]
            try:
                os.environ["PATH"] = os.pathsep.join([str(base / "first"), str(base / "second")])
                self.assertEqual(Path(module.media_tool("ffmpeg")), valid)
            finally:
                os.environ["PATH"] = original_path


if __name__ == "__main__":
    unittest.main()
