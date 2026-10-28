"""Local font assets must follow the selected Remotion theme."""
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import render_remotion


class MotionFontTests(unittest.TestCase):
    def test_oil_stages_huimo_and_refreshes_changed_font_bytes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            fonts = root / 'engine/fonts'
            fonts.mkdir(parents=True)
            names = ['NotoSerifSC-VF.ttf', 'CormorantGaramond.ttf', 'WenYue-HuiMoShouShu-J.otf']
            for name in names:
                (fonts / name).write_bytes(name.encode())
            with patch.object(render_remotion, 'ROOT', root), patch.object(render_remotion, 'REMOTION', root / 'remotion'):
                render_remotion.stage(root / 'project', {'theme': 'M02'})
                target = root / 'remotion/public/fonts' / names[-1]
                self.assertTrue(target.is_file(), 'M02 must serve its actual local Huimo font')
                self.assertEqual(target.read_bytes(), (fonts / names[-1]).read_bytes())
                target.write_bytes(b'old font')
                render_remotion.stage(root / 'project', {'theme': 'M02'})
                self.assertEqual(target.read_bytes(), (fonts / names[-1]).read_bytes())

    def test_paper_does_not_require_oil_font(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            fonts = root / 'engine/fonts'
            fonts.mkdir(parents=True)
            for name in ['NotoSerifSC-VF.ttf', 'CormorantGaramond.ttf']:
                (fonts / name).write_bytes(name.encode())
            with patch.object(render_remotion, 'ROOT', root), patch.object(render_remotion, 'REMOTION', root / 'remotion'):
                props = render_remotion.stage(root / 'project', {'theme': 'M01'})
                self.assertEqual(props['motion']['theme'], 'M01')
