"""Opt-in real Remotion/Chrome subtitle rendering at the input contract limits."""
import hashlib
from itertools import product
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import wave

ROOT = Path(__file__).resolve().parents[1]


@unittest.skipUnless(os.environ.get('VIBE_RUN_REMOTION') == '1', 'Set VIBE_RUN_REMOTION=1 for real render checks')
class MotionRenderTests(unittest.TestCase):
    def test_all_valid_subtitle_lengths_fit_actual_available_width(self):
        scratch = ROOT / '_smoke'; scratch.mkdir(exist_ok=True)
        cases = [('路'*16, ''), ('路'*18, ''), ('路'*18+'\n'+'路'*18, ''), ('路', 'W'*60)]
        for theme, (zh, en) in product(('M01', 'M02'), cases):
            with self.subTest(theme=theme, zh=zh, en=en), tempfile.TemporaryDirectory(dir=scratch) as temp:
                project = Path(temp)
                audio = project / 'audio'; audio.mkdir()
                text = zh.replace('\n', '')
                (project / 'script.json').write_text(json.dumps({'book_title': '测试', 'author': '作者',
                    'segments': [{'id': 'one', 'text': text}]}), encoding='utf-8')
                (audio / 'timings.json').write_text(json.dumps({'duration': 2, 'segments': [
                    {'id': 'one', 'text': text, 'start': .1, 'end': 1.9}]}), encoding='utf-8')
                with wave.open(str(audio / 'narration.wav'), 'wb') as out:
                    out.setparams((1, 2, 48000, 0, 'NONE', 'not compressed')); out.writeframes(b'\0\0'*96000)
                value = {'schema_version': 1, 'renderer': 'remotion', 'theme': theme, 'draft': False,
                    'title': '测试', 'author': '作者', 'width': 1080, 'height': 1920, 'fps': 30, 'duration': 2,
                    'source_hashes': {p: hashlib.sha256((project/p).read_bytes()).hexdigest() for p in
                                      ['script.json', 'audio/timings.json', 'audio/narration.wav']},
                    'shots': [{'id': 'one', 'segment_ids': ['one'], 'start': 0, 'end': 2,
                        'scene_type': 'corridor', 'scene_props': {'cycles': 1}, 'kind': '情绪隐喻', 'intent': '循环'}],
                    'subtitles': [{'start': .1, 'end': 1.9, 'zh': zh, 'en': en}], 'title_card': None, 'closing': None}
                (project / 'motion.json').write_text(json.dumps(value), encoding='utf-8')
                (project / 'storyboard.md').write_text('# 字幕边界审查', encoding='utf-8')
                result = subprocess.run([sys.executable, str(ROOT / 'scripts/render_remotion.py'), str(project), '--stills', '1'],
                    capture_output=True, text=True, encoding='utf-8', env={**os.environ, 'PYTHONUTF8': '1'})
                self.assertEqual(result.returncode, 0, result.stdout+result.stderr)
