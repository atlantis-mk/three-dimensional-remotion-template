"""运行：python3 -m unittest discover -s tests -p 'test_*.py'。不调用付费服务。"""
import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / '.agents/skills/make-video/scripts'
sys.path.insert(0, str(SCRIPTS))
from pipeline import SOURCE_REL, init  # noqa: E402
from pipeline_lib import fingerprint, inside, outputs, timeline_errors, video_settings, write_json  # noqa: E402


class PipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory()
        content = Path(cls.temporary.name) / 'content.json'
        subprocess.run(['node', 'scripts/content.cjs', 'export', str(content)], cwd=ROOT / SOURCE_REL,
                       capture_output=True, text=True, check=True)
        cls.content = json.loads(content.read_text())

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def task(self):
        return {'video': {'width': 1920, 'height': 1080, 'aspect_ratio': '16:9', 'fps': 30,
                          'duration_seconds': 60, 'duration_in_frames': 1800}, 'deliverables': []}

    def test_timeline_rejects_gaps_overlaps_and_outside_actions(self):
        self.assertEqual(timeline_errors(self.content), [])
        for mutation in ('gap', 'overlap', 'step', 'subtitle', 'cover'):
            value = copy.deepcopy(self.content)
            if mutation == 'gap': value['scenes'][1]['start'] += 0.2
            elif mutation == 'overlap': value['scenes'][1]['start'] -= 0.2
            elif mutation == 'step': value['scenes'][1]['steps'][0]['at'] = 20
            elif mutation == 'subtitle': value['subtitles'][0]['end'] = 80
            else: value['cover'] = {'sceneIndex': 99}
            with self.subTest(mutation=mutation):
                self.assertTrue(timeline_errors(value))

    def test_video_requires_confirmed_consistent_parameters(self):
        task = self.task()
        self.assertEqual(video_settings(task, self.content)[1], 'Main')
        task['video']['width'], task['video']['height'], task['video']['aspect_ratio'] = 1080, 1920, '9:16'
        self.assertEqual(video_settings(task, self.content)[1], 'MainVertical')
        task['video']['duration_in_frames'] = 30
        with self.assertRaises(ValueError): video_settings(task, self.content)
        task['video']['fps'] = None
        with self.assertRaises(ValueError): video_settings(task, self.content)

    def test_init_resumes_without_overwriting_edits(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / SOURCE_REL
            source.mkdir(parents=True)
            write_json(source / 'package.json', {'name': 'test'})
            (source / 'src').mkdir()
            (source / 'src/Film.tsx').write_text('original')
            (source / 'node_modules').mkdir()
            (source / 'node_modules/not-copied').write_text('cache')
            init(root, False)
            task_path = root / 'work/task.json'
            self.assertEqual(json.loads(task_path.read_text())['status'], 'not_started')
            self.assertTrue((root / 'work/input/audio').is_dir())
            self.assertTrue((root / 'work/delivery').is_dir())
            task_path.write_text('{"status":"in_progress","brief":{"topic":"用户主题"}}')
            target = root / 'work/project/src/Film.tsx'
            target.write_text('user edit')
            init(root, False)
            self.assertEqual(target.read_text(), 'user edit')
            self.assertEqual(json.loads(task_path.read_text())['brief']['topic'], '用户主题')
            self.assertFalse((root / 'work/project/node_modules').exists())

    def test_delivery_list_honors_explicit_override_and_rejects_escape(self):
        task = self.task()
        self.assertEqual(len(outputs(task)), 4)
        task['deliverables'] = [dict(path='work/delivery/custom.mp4', type='video', width=1920, height=1080)]
        self.assertEqual(len(outputs(task)), 1)
        task['deliverables'][0]['path'] = 'work/delivery/../../original.mp4'
        with self.assertRaises(ValueError): outputs(task)
        with self.assertRaises(ValueError): inside(ROOT, '../original')

    def test_fingerprint_invalidates_changed_media_and_ignores_task_progress(self):
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            (project / 'public').mkdir()
            media = project / 'public/voice.wav'
            media.write_bytes(b'audio one')
            task = self.task()
            before = fingerprint(project, task)
            task['stage'] = 'delivery'
            self.assertEqual(before, fingerprint(project, task))
            media.write_bytes(b'audio two')
            self.assertNotEqual(before, fingerprint(project, task))

    def test_check_without_workspace_does_not_create_one(self):
        with tempfile.TemporaryDirectory() as directory:
            p = subprocess.run([sys.executable, str(SCRIPTS / 'pipeline.py'), '--root', directory, 'check'],
                               capture_output=True, text=True)
            self.assertEqual(p.returncode, 5)
            self.assertFalse((Path(directory) / 'work').exists())


if __name__ == '__main__':
    unittest.main()
