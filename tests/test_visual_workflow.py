import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
ENV = {**os.environ, "PYTHONUTF8": "1"}
IDS = [f"S{i:02d}" for i in range(1, 7)]


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="vibe-style-")
        self.addCleanup(self.temp.cleanup)
        self.project = Path(self.temp.name) / "project"

    def cli(self, script, *args):
        return subprocess.run([sys.executable, str(ROOT / "scripts" / script), *map(str, args)],
                              capture_output=True, text=True, encoding="utf-8", env=ENV)

    def create(self, style="S01"):
        result = self.cli("new_film.py", self.project, "--world", style)
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        return result

    def manifest(self):
        p = self.project / "art-direction.json"
        self.assertTrue(p.exists(), "工程必须带出可编辑的绘画清单")
        return json.loads(p.read_text(encoding="utf-8"))

    def save(self, value):
        (self.project / "art-direction.json").write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")

    def complete(self):
        value = self.manifest()
        value["visual"]["characters"] = "短发成年女性，米色开衫"
        value["visual"]["era_location"] = "现代普通住宅"
        for shot in value["shots"]:
            shot.update(kind="情绪隐喻", evidence="", scene="窗边的小桌", action="合上书，望向窗外",
                        emotion="释然", framing="中景")
        self.save(value)
        return value

    def test_all_six_styles_create_different_config_and_material_prompts(self):
        materials = set()
        for style in IDS:
            with self.subTest(style=style):
                self.project = Path(self.temp.name) / style
                self.create(style.lower())
                value = self.manifest()
                self.assertEqual(value["style"], style)
                self.assertIn("art-direction.js", (self.project / "index.html").read_text(encoding="utf-8"))
                self.assertIn("engine/art.js", (self.project / "index.html").read_text(encoding="utf-8"))
                materials.add(json.loads((self.project / "art-direction.js").read_text(encoding="utf-8")
                                         .removeprefix("window.ART_DIRECTION = ").removesuffix(";\n"))["style"]["material"])
                self.assertTrue((self.project / "art-prompts.md").exists())
                self.assertTrue((self.project / "storyboard.md").exists())
        self.assertEqual(len(materials), 6)

    def test_default_and_review_style_mapping_and_explicit_override(self):
        self.project.mkdir()
        (self.project / "script.json").write_text(json.dumps({"review_style": "遗憾告别"}), encoding="utf-8")
        result = self.cli("new_film.py", self.project, "--renderer", "canvas")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.manifest()["style"], "S03")
        self.cli("new_film.py", self.project, "--world", "S05", "--force")
        self.assertEqual(self.manifest()["style"], "S05")
        self.project = Path(self.temp.name) / "default"
        self.assertEqual(self.cli("new_film.py", self.project, "--renderer", "canvas").returncode, 0)
        self.assertEqual(self.manifest()["style"], "S01")

    def test_legacy_worlds_remain_available(self):
        for style in ["B", "C"]:
            self.project = Path(self.temp.name) / style
            result = self.cli("new_film.py", self.project, "--world", style)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue((self.project / "film.js").exists())
            self.assertFalse((self.project / "art-direction.json").exists())

    def test_invalid_style_does_not_create_directory(self):
        result = self.cli("new_film.py", self.project, "--world", "S99")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.project.exists())

    def test_existing_film_is_not_overwritten(self):
        self.create()
        original = (self.project / "film.js").read_bytes()
        result = self.cli("new_film.py", self.project, "--world", "S02")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(original, (self.project / "film.js").read_bytes())
        self.assertEqual(self.manifest()["style"], "S01")

    def test_timings_text_with_quotes_backslash_and_newline_is_valid_js(self):
        (self.project / "audio").mkdir(parents=True)
        text = "他说'别急'，C:\\路\n慢慢来"
        (self.project / "audio/timings.json").write_text(json.dumps({
            "duration": 8, "segments": [{"id": "hook", "text": text, "start": .35, "end": 5.5}]
        }), encoding="utf-8")
        self.create()
        self.assertEqual(self.manifest()["duration"], 8)
        self.assertEqual(self.manifest()["shots"][0]["narration"], text)
        syntax = subprocess.run(["node", "--check", str(self.project / "film.js")], capture_output=True, text=True)
        self.assertEqual(syntax.returncode, 0, syntax.stderr)

    def test_draft_cannot_be_prepared_without_scene(self):
        self.create()
        result = self.cli("prepare_art.py", self.project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("scene", result.stderr + result.stdout)

    def test_ready_prompts_contain_style_action_and_truth_label(self):
        self.create("S04")
        self.complete()
        result = self.cli("prepare_art.py", self.project)
        self.assertEqual(result.returncode, 0, result.stderr)
        prompts = (self.project / "art-prompts.md").read_text(encoding="utf-8")
        for content in ["淡彩水彩散文", "透明水彩", "合上书", "情绪隐喻", "不要文字", "9:16"]:
            self.assertIn(content, prompts)
        self.assertNotIn("【", prompts)

    def test_overlap_and_outside_paths_are_rejected(self):
        self.create()
        value = self.complete()
        value["shots"].append({**value["shots"][0], "id": "duplicate-time"})
        self.save(value)
        self.assertNotEqual(self.cli("prepare_art.py", self.project).returncode, 0)
        value["shots"] = value["shots"][:1]
        value["shots"][0]["image"] = "../outside.png"
        self.save(value)
        result = self.cli("prepare_art.py", self.project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("工程", result.stderr + result.stdout)

    def test_original_scene_requires_evidence(self):
        self.create()
        value = self.complete()
        value["shots"][0]["kind"] = "原著场景"
        self.save(value)
        result = self.cli("prepare_art.py", self.project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("evidence", result.stderr + result.stdout)

    def test_checker_rejects_missing_images_and_detects_stale_style(self):
        self.create()
        self.complete()
        self.assertEqual(self.cli("prepare_art.py", self.project).returncode, 0)
        result = self.cli("check_film.py", self.project, "--no-audio", "--json")
        report = json.loads(result.stdout)
        self.assertTrue(any(x["status"] == "FAIL" and "素材" in x["name"] for x in report["results"]))
        value = self.manifest()
        value["style"] = "S02"
        self.save(value)
        report = json.loads(self.cli("check_film.py", self.project, "--no-audio", "--json").stdout)
        self.assertTrue(any(x["status"] == "FAIL" and "一致" in x["name"] for x in report["results"]))


    def test_force_preserves_selected_style_when_not_explicitly_changed(self):
        self.create("S06")
        result = self.cli("new_film.py", self.project, "--force")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.manifest()["style"], "S06")

    def test_prepare_rejects_stale_narration_duration(self):
        self.create()
        value = self.complete()
        (self.project / "audio").mkdir()
        (self.project / "audio/timings.json").write_text(json.dumps({
            "duration": 15, "segments": []
        }), encoding="utf-8")
        result = self.cli("prepare_art.py", self.project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("旁白", result.stderr + result.stdout)

    def test_rebuilding_with_new_style_keeps_storyboard_content_and_updates_header(self):
        self.create("S01")
        story = self.project / "storyboard.md"
        story.write_text(story.read_text(encoding="utf-8") + "\\n保留我的手写分镜\\n", encoding="utf-8")
        result = self.cli("new_film.py", self.project, "--world", "S02", "--force")
        self.assertEqual(result.returncode, 0, result.stderr)
        updated = story.read_text(encoding="utf-8")
        self.assertIn("保留我的手写分镜", updated)
        self.assertIn("画风：S02", updated)

if __name__ == "__main__":
    unittest.main()
