"""维护用真实渲染验证：横竖各 1 秒 + 三张封面；不启动本期任务，不写 delivery。

先在技能 assets/project-template/ 安装依赖，再运行 python3 tests/smoke_pipeline.py。
临时工程复用已安装依赖；结果留在 tests/artifacts/template-check-*，不创建根目录 work。
"""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / '.agents/skills/make-video/scripts'
sys.path.insert(0, str(SCRIPTS))
from pipeline import SOURCE_REL, init, remotion  # noqa: E402
from pipeline_lib import now, read_json, sha256, write_json  # noqa: E402


def main():
    evidence = ROOT / 'tests/artifacts'
    evidence.mkdir(parents=True, exist_ok=True)
    task_path = ROOT / 'work/task.json'
    before = task_path.read_bytes() if task_path.exists() else None
    report = {'kind': 'template_maintenance', 'started_at': now(), 'checks': []}
    with tempfile.TemporaryDirectory(prefix='three-dimensional-template-') as directory:
        root = Path(directory)
        # 只读基准；init 验证会从这里复制到临时 work/project。
        (root / SOURCE_REL).parent.mkdir(parents=True)
        (root / SOURCE_REL).symlink_to(ROOT / SOURCE_REL, target_is_directory=True)
        init(root, False)
        project = root / 'work/project'
        (project / 'node_modules').symlink_to(ROOT / SOURCE_REL / 'node_modules', target_is_directory=True)
        init(root, False)
        content = read_json(project / 'content.json')
        content.update(durationInSeconds=1, subtitles=[], ambient=False)
        scene = content['scenes'][1]
        scene.update(start=0, end=1, steps=[], index='00', transition='cut')
        content['scenes'] = [scene]
        content['cover'] = {'title': '从煎饼摊到上市公司', 'subtitle': '复制 · 品牌 · 资本 · 规范', 'sceneIndex': 0}
        write_json(project / 'content.json', content)
        task = read_json(root / 'work/task.json')
        task['video'].update(width=1920, height=1080, fps=30, duration_seconds=1, duration_in_frames=30, aspect_ratio='16:9')
        write_json(root / 'work/task.json', task)

        def call(*args):
            p = subprocess.run([sys.executable, str(SCRIPTS / 'pipeline.py'), '--root', str(root), *args],
                               capture_output=True, text=True)
            print(p.stdout, flush=True)
            if p.returncode:
                print(p.stderr, file=sys.stderr)
                for path in (root / 'work/preview').glob('*.log'):
                    shutil.copy2(path, evidence / ('template-check-failed-' + path.name))
                raise RuntimeError(f'验证失败：{args}')
            return json.loads(p.stdout.strip().splitlines()[-1])

        call('render')
        report['checks'].append({'landscape_and_covers': call('verify')})
        for path in (root / 'work/delivery').iterdir():
            if path.suffix in ('.png', '.mp4'):
                shutil.copy2(path, evidence / ('template-check-pipeline-' + path.name))
        # 静帧 fps=1 与视频 fps 不同：两个选景进度必须产生不同三维状态。
        saved_cover = dict(content['cover'])
        content['cover']['progress'] = 0
        write_json(project / 'content.json', content)
        start_cover = root / 'work/preview/cover-start.png'
        remotion(project, 'still', 'Cover16x9', start_cover, project / 'content.json', ['--frame=0'])
        if sha256(start_cover) == sha256(root / 'work/delivery/cover-16x9.png'):
            raise RuntimeError('封面选景进度未改变实际画面')
        content['cover'] = saved_cover
        write_json(project / 'content.json', content)
        report['checks'].append({'cover_progress_changes_actual_frame': True})
        # 真实改变方向后旧输出应失效，不能继承横版通过记录。
        task['video'].update(width=1080, height=1920, aspect_ratio='9:16')
        task['deliverables'] = [dict(path='work/delivery/video.mp4', type='video', width=1080, height=1920)]
        write_json(root / 'work/task.json', task)
        stale = subprocess.run([sys.executable, str(SCRIPTS / 'pipeline.py'), '--root', str(root), 'verify'], capture_output=True)
        if stale.returncode == 0:
            raise RuntimeError('变更画幅后旧交付未被判定失效')
        report['checks'].append({'stale_output_rejected': True})
        call('render', '--only', 'video')
        report['checks'].append({'portrait': call('verify')})
        shutil.copy2(root / 'work/delivery/video.mp4', evidence / 'template-check-pipeline-vertical.mp4')
        # 无配音不需要 Key；外部配音不匹配时应报错。
        content['voiceover']['file'] = 'missing.wav'
        write_json(project / 'content.json', content)
        missing = subprocess.run([sys.executable, str(SCRIPTS / 'pipeline.py'), '--root', str(root), 'validate'], capture_output=True)
        if missing.returncode != 5:
            raise RuntimeError('缺失配音未被判定为输入错误')
        report['checks'].append({'missing_voiceover_rejected': True})
    after = task_path.read_bytes() if task_path.exists() else None
    if after != before or (before is None and (ROOT / 'work').exists()):
        raise RuntimeError('维护验证意外修改本期任务')
    report.update(ok=True, finished_at=now(), visual_review='not_run', audio_review='not_run')
    write_json(evidence / 'template-check-pipeline-report.json', report)


if __name__ == '__main__':
    main()
