"""Regression checks for renderer dispatch, stale inputs and frame-accurate clips."""
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import wave

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))


class MotionWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='vibe-motion-')
        self.addCleanup(self.temp.cleanup)
        self.project = Path(self.temp.name) / '中文 工程'
        self.project.mkdir()

    def cli(self, name, *args):
        return subprocess.run([sys.executable, str(ROOT / 'scripts' / name), *map(str, args)],
                              capture_output=True, text=True, encoding='utf-8',
                              env={**os.environ, 'PYTHONUTF8': '1'})

    def fixture(self):
        audio = self.project / 'audio'
        audio.mkdir()
        (self.project / 'script.json').write_text(json.dumps({'book_title': '测试书', 'author': '作者',
            'segments': [{'id': 'one', 'text': '走完这条路。'}]}, ensure_ascii=False), encoding='utf-8')
        (audio / 'timings.json').write_text(json.dumps({'duration': 2.001,
            'segments': [{'id': 'one', 'text': '走完这条路。', 'start': 0.1, 'end': 1.9}]}), encoding='utf-8')
        with wave.open(str(audio / 'narration.wav'), 'wb') as out:
            out.setparams((1, 2, 48000, 0, 'NONE', 'not compressed'))
            out.writeframes(b'\0\0' * 96048)
        files = ['script.json', 'audio/timings.json', 'audio/narration.wav']
        return {'schema_version': 1, 'renderer': 'remotion', 'theme': 'M01', 'draft': False,
            'title': '测试书', 'author': '作者', 'duration': 2.001, 'width': 1080, 'height': 1920, 'fps': 30,
            'source_hashes': {p: hashlib.sha256((self.project / p).read_bytes()).hexdigest() for p in files},
            'shots': [{'id': 'one', 'segment_ids': ['one'], 'start': 0, 'end': 2.001,
                       'scene_type': 'corridor', 'scene_props': {'cycles': 1}, 'kind': '情绪隐喻',
                       'evidence': '', 'intent': '走到尽头又回原点'}],
            'subtitles': [{'start': 0.1, 'end': 1.9, 'zh': '走完这条路。'}],
            'title_card': None, 'closing': None}

    def test_new_project_defaults_to_remotion_draft_without_images(self):
        result = self.cli('new_film.py', self.project)
        self.assertEqual(result.returncode, 0, result.stderr)
        value = json.loads((self.project / 'motion.json').read_text(encoding='utf-8'))
        self.assertEqual(value['renderer'], 'remotion')
        self.assertTrue(value['draft'])
        self.assertFalse((self.project / 'art-direction.json').exists())
        self.assertFalse((self.project / 'film.js').exists())

    def test_explicit_canvas_retains_style_mapping(self):
        (self.project / 'script.json').write_text('{"review_style":"遗憾告别"}', encoding='utf-8')
        result = self.cli('new_film.py', self.project, '--renderer', 'canvas')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads((self.project / 'art-direction.json').read_text(encoding='utf-8'))['style'], 'S03')

    def test_oil_theme_can_be_created_and_validated_without_images(self):
        from motion_project import validate_motion
        value = self.fixture()
        value['theme'] = 'M02'
        self.assertEqual(validate_motion(value, self.project), [])
        result = self.cli('new_film.py', self.project, '--theme', 'M02')
        self.assertEqual(result.returncode, 0, result.stderr)
        created = json.loads((self.project / 'motion.json').read_text(encoding='utf-8'))
        self.assertEqual(created['theme'], 'M02')
        self.assertIn('油画', (self.project / 'storyboard.md').read_text(encoding='utf-8'))
        self.assertFalse((self.project / 'assets').exists())

    def test_theme_cannot_be_silently_ignored_by_canvas(self):
        for args in [('--renderer', 'canvas'), ('--world', 'S01')]:
            with self.subTest(args=args):
                result = self.cli('new_film.py', self.project, '--theme', 'M02', *args)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse((self.project / 'motion.json').exists())
                self.assertFalse((self.project / 'film.js').exists())

    def test_conflicting_renderer_and_world_does_not_write_project(self):
        result = self.cli('new_film.py', self.project, '--renderer', 'remotion', '--world', 'S01')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(list(self.project.iterdir()), [])

    def test_existing_remotion_is_never_overwritten_even_with_force(self):
        self.cli('new_film.py', self.project)
        path = self.project / 'motion.json'
        before = path.read_bytes()
        result = self.cli('new_film.py', self.project, '--force')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(path.read_bytes(), before)

    def test_existing_canvas_requires_explicit_force_and_does_not_switch(self):
        self.assertEqual(self.cli('new_film.py', self.project, '--world', 'C').returncode, 0)
        result = self.cli('new_film.py', self.project)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.project / 'motion.json').exists())

    def test_valid_ready_manifest_and_absolute_frames(self):
        from motion_project import validate_motion, frame_range
        self.assertEqual(validate_motion(self.fixture(), self.project), [])
        self.assertEqual(frame_range(12.091, 24.961, 44.991), (363, 749))
        self.assertEqual(frame_range(0, 2.001, 2.001), (0, 61))

    def test_invalid_clip_ranges_are_rejected(self):
        from motion_project import frame_range
        for bounds in [(-1, 2), (2, 1), (0, 3), (0, 0.001), (0, float('nan'))]:
            with self.subTest(bounds=bounds), self.assertRaises(ValueError):
                frame_range(*bounds, 2.001)

    def test_full_oil_scenes_are_supported_only_by_oil_theme(self):
        from motion_project import validate_motion
        value = self.fixture()
        for scene in ('market', 'portraits', 'table', 'city', 'quarrel', 'book', 'empty_table'):
            with self.subTest(scene=scene):
                value['theme'] = 'M02'
                value['shots'][0].update(scene_type=scene, scene_props={})
                self.assertEqual(validate_motion(value, self.project), [])
                value['theme'] = 'M01'
                self.assertTrue(any('M02' in e for e in validate_motion(value, self.project)))

    def test_source_changes_missing_audio_and_external_paths_are_rejected(self):
        from motion_project import validate_motion
        value = self.fixture()
        (self.project / 'script.json').write_text('{}', encoding='utf-8')
        self.assertTrue(any('script.json' in e for e in validate_motion(value, self.project)))
        (self.project / 'audio/narration.wav').unlink()
        self.assertTrue(any('narration.wav' in e for e in validate_motion(value, self.project)))
        value['source_hashes']['../outside.wav'] = '0' * 64
        self.assertTrue(any('路径' in e for e in validate_motion(value, self.project)))

    def test_draft_unknown_scene_missing_parameters_and_coverage_are_rejected(self):
        from motion_project import validate_motion
        base = self.fixture()
        variants = []
        draft = copy.deepcopy(base); draft['draft'] = True; variants.append(draft)
        unknown = copy.deepcopy(base); unknown['shots'][0]['scene_type'] = 'unknown'; variants.append(unknown)
        unknown_theme = copy.deepcopy(base); unknown_theme['theme'] = 'M03'; variants.append(unknown_theme)
        params = copy.deepcopy(base); params['shots'][0]['scene_props'] = {}; variants.append(params)
        gap = copy.deepcopy(base); gap['shots'][0]['start'] = 0.5; variants.append(gap)
        ref = copy.deepcopy(base); ref['shots'][0]['segment_ids'] = ['missing']; variants.append(ref)
        for value in variants:
            self.assertTrue(validate_motion(value, self.project))

    def test_subtitle_safety_and_spoken_text_are_validated(self):
        from motion_project import validate_motion
        base = self.fixture()
        for text in ['字' * 19, '甲\n乙\n丙', '改写了旁白。']:
            value = copy.deepcopy(base); value['subtitles'][0]['zh'] = text
            self.assertTrue(validate_motion(value, self.project))
        value = copy.deepcopy(base); value['subtitles'].append(copy.deepcopy(value['subtitles'][0]))
        self.assertTrue(validate_motion(value, self.project))
        value = copy.deepcopy(base); value['subtitles'][0].update(zh='走完\n这条路。', en='The road.')
        self.assertTrue(validate_motion(value, self.project))

    def test_wrong_json_types_are_readable_validation_errors(self):
        from motion_project import validate_motion
        base = self.fixture()
        for field, wrong in [('duration', float('nan')), ('fps', True), ('shots', {}),
                             ('subtitles', None), ('source_hashes', []), ('draft', 'false')]:
            value = copy.deepcopy(base); value[field] = wrong
            with self.subTest(field=field):
                self.assertTrue(validate_motion(value, self.project))
        self.assertTrue(validate_motion([], self.project))

    def test_render_refuses_draft_before_loading_node(self):
        self.cli('new_film.py', self.project)
        result = self.cli('render_remotion.py', self.project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('draft', result.stdout + result.stderr)

    def test_sample_uses_quantized_audio_boundaries_and_rebases_subtitles(self):
        from make_remotion_sample import clip_timeline
        timing = {'duration': 44.991, 'segments': [
            {'id': 'road', 'text': '不是纪念，是路还没走完。', 'start': 12.091, 'end': 14.938},
            {'id': 'fish', 'text': '上校做完金鱼，熔掉，再重做。', 'start': 15.388, 'end': 18.653},
            {'id': 'rain', 'text': '一场雨，下了四年十一个月。', 'start': 19.053, 'end': 21.901},
            {'id': 'after', 'text': '雨停以后，人还站在原地。', 'start': 22.401, 'end': 24.961}]}
        subs = [{'a': s['start'], 'b': s['end'], 'zh': s['text']} for s in timing['segments']]
        local, local_subs, interval = clip_timeline(timing, subs, 12.091, 24.961)
        self.assertEqual(interval, (363, 749))
        self.assertAlmostEqual(local['duration'], 12.866666666666667)
        self.assertEqual(local['segments'][0]['start'], 0)
        self.assertAlmostEqual(local_subs[1]['start'], 3.288)
        self.assertEqual(local_subs[1]['zh'], '上校做完金鱼，熔掉，再重做。')
        self.assertAlmostEqual(local['segments'][-1]['end'], 12.861)

    def test_sample_refuses_cutting_through_a_spoken_segment(self):
        from make_remotion_sample import clip_timeline
        timing = {'duration': 10, 'segments': [{'id': 's', 'text': '一句完整旁白', 'start': 1, 'end': 9}]}
        with self.assertRaises(ValueError):
            clip_timeline(timing, [{'a': 1, 'b': 9, 'zh': '一句完整旁白'}], 3, 6)

    def test_checker_accepts_remotion_without_legacy_files(self):
        value = self.fixture()
        (self.project / 'motion.json').write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
        (self.project / 'storyboard.md').write_text('# 已审分镜', encoding='utf-8')
        result = self.cli('check_film.py', self.project, '--no-audio', '--json')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        report = json.loads(result.stdout)
        self.assertFalse(any(item['status'] == 'FAIL' for item in report['results']))

    def test_checker_detects_audio_contaminated_raw_even_with_no_audio_flag(self):
        from media_tools import media_tool
        value = self.fixture()
        (self.project / 'motion.json').write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
        (self.project / 'storyboard.md').write_text('# 已审分镜', encoding='utf-8')
        renders = self.project / 'renders'; renders.mkdir()
        subprocess.run([media_tool('ffmpeg'), '-v', 'error', '-y', '-f', 'lavfi', '-i',
            'color=size=1080x1920:rate=30:duration=2.033333333', '-i', str(self.project / 'audio/narration.wav'),
            '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', str(renders / 'raw.mp4')], check=True)
        result = self.cli('check_film.py', self.project, '--no-audio', '--json')
        self.assertNotEqual(result.returncode, 0)
        report = json.loads(result.stdout)
        self.assertTrue(any(item['status'] == 'FAIL' and '无声' in item['name'] for item in report['results']))

    def test_subtitle_measurement_cannot_pass_with_no_observations(self):
        from render_remotion import validate_geometry
        target = self.project / 'bounds.json'
        target.write_text('[]', encoding='utf-8')
        with self.assertRaises(ValueError):
            validate_geometry(target)

    def test_frame_aligned_duration_does_not_gain_a_floating_point_frame(self):
        from motion_project import frame_range
        self.assertEqual(frame_range(0, 31/30, 31/30), (0, 31))

    def test_render_snapshot_rejects_input_changed_during_render(self):
        from motion_project import load_motion_snapshot, assert_snapshot_current
        value = self.fixture()
        path = self.project / 'motion.json'
        path.write_text(json.dumps(value), encoding='utf-8')
        snapshot, fingerprint = load_motion_snapshot(self.project)
        value['title'] = '运行中修改书名'
        path.write_text(json.dumps(value), encoding='utf-8')
        with self.assertRaises(ValueError):
            assert_snapshot_current(self.project, fingerprint, snapshot)

    def test_checker_rejects_subtitle_evidence_from_previous_motion(self):
        value = self.fixture()
        path = self.project / 'motion.json'
        path.write_text(json.dumps(value), encoding='utf-8')
        (self.project / 'storyboard.md').write_text('# 已审分镜', encoding='utf-8')
        review = self.project / 'review'; review.mkdir()
        (review / 'subtitle-bounds.json').write_text(json.dumps([{'frame': 10, 'bounds': [
            {'bottom': 1560, 'left': 64, 'right': 1016, 'scrollWidth': 952, 'width': 952}]}]), encoding='utf-8')
        (review / 'subtitle-bounds.meta.json').write_text(json.dumps({'motion_sha256': '0'*64}), encoding='utf-8')
        result = self.cli('check_film.py', self.project, '--no-audio', '--json')
        self.assertNotEqual(result.returncode, 0)

    def test_malformed_timing_draft_creation_has_no_traceback_or_partial_files(self):
        audio = self.project / 'audio'; audio.mkdir()
        (audio / 'timings.json').write_text('[]', encoding='utf-8')
        result = self.cli('new_film.py', self.project)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('Traceback', result.stderr)
        self.assertFalse((self.project / 'motion.json').exists())


if __name__ == '__main__':
    unittest.main()
