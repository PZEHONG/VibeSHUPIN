import sys, tempfile, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from motion_project import asset_hashes

class AssetTests(unittest.TestCase):
    def test_hashes_detect_changes_and_reject_escape(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); (root / 'assets').mkdir(); p = root / 'assets/a.png'; p.write_bytes(b'one')
            motion = {'shots': [{'scene_type': 'media', 'scene_props': {'layers': [{'src': 'assets/a.png', 'type': 'image'}]}}]}
            before = asset_hashes(root, motion)
            p.write_bytes(b'two')
            self.assertNotEqual(before, asset_hashes(root, motion))
            motion['shots'][0]['scene_props']['layers'][0]['src'] = '../outside.png'
            with self.assertRaises(ValueError): asset_hashes(root, motion)

    def test_missing_asset_is_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):
                asset_hashes(Path(d), {'shots': [{'scene_type': 'media', 'scene_props': {'layers': [{'src': 'assets/no.png', 'type': 'image'}]}}]})

    def test_audio_clip_uses_frame_boundaries(self):
        import wave
        from render_remotion import add_clip_audio
        import subprocess
        from media_tools import media_tool
        with tempfile.TemporaryDirectory() as d:
            root=Path(d); source=root/'source.wav'; video=root/'silent.mp4'; output=root/'sample.mp4'
            with wave.open(str(source), 'wb') as f:
                f.setparams((1, 2, 48000, 0, 'NONE', 'not compressed'))
                f.writeframes(b'\x01\x00' * 96000)
            subprocess.run([media_tool('ffmpeg'), '-v', 'error', '-f', 'lavfi', '-i', 'color=s=32x32:r=30:d=1', '-c:v', 'libx264', str(video)], check=True)
            add_clip_audio(video, source, output, (15,45), 30)
            info=subprocess.run([media_tool('ffprobe'), '-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', str(output)], capture_output=True, text=True, check=True)
            self.assertIn('audio', info.stdout)
            self.assertIn('video', info.stdout)

    def test_ready_validation_reports_stale_media(self):
        from motion_project import validate_motion
        with tempfile.TemporaryDirectory() as d:
            root=Path(d); (root/'assets').mkdir(); asset=root/'assets/a.png'; asset.write_bytes(b'before')
            value={'renderer':'remotion','theme':'CUSTOM','schema_version':1,'draft':False,'width':1080,'height':1920,'fps':30,'duration':1,'title':'x','author':'y','visual_direction':{'style':'a','palette':'b','characters':'c'},'shots':[{'id':'x','start':0,'end':1,'scene_type':'media','scene_props':{'layers':[{'src':'assets/a.png','type':'image'}]},'segment_ids':[],'kind':'情绪隐喻','intent':'x'}],'subtitles':[],'source_hashes':{}}
            value['asset_hashes']=asset_hashes(root,value)
            asset.write_bytes(b'after')
            self.assertTrue(any('素材已改变' in error for error in validate_motion(value,root)))
