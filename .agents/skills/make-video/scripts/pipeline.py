#!/usr/bin/env python3
"""单期模板工具：env / init / validate / check / preview / render / verify。

所有命令均可从任意工作目录运行。末行输出 JSON；0 成功、2 用法错误、3 环境缺失、5 输入不合法、7 执行或检查失败。
脚本只生成工程与检查记录，不代替 AI 的分镜、视觉/听觉验收，也不自动将任务设为 completed。
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from pipeline_lib import (fingerprint, inside, now, outputs, probe, read_json, sha256,
                          timeline_errors, verify_file, video_settings, write_json)

ROOT = Path(__file__).resolve().parents[4]
SKILL_REL = Path('.agents/skills/make-video')
SOURCE_REL = SKILL_REL / 'assets/project-template'
TASK_TEMPLATE = Path(__file__).resolve().parents[1] / 'assets/task-template.json'
IGNORED = shutil.ignore_patterns('node_modules', '.git', 'out', '.cache', '.remotion', '__pycache__', '.DS_Store', '*.tsbuildinfo')
COVERS = {(1600, 1200): 'Cover4x3', (1200, 1600): 'Cover3x4', (1920, 1080): 'Cover16x9'}


def run(command, cwd, log):
    log.parent.mkdir(parents=True, exist_ok=True)
    with log.open('a', encoding='utf-8') as stream:
        stream.write('\n' + json.dumps([str(x) for x in command], ensure_ascii=False) + '\n')
        stream.flush()
        result = subprocess.run([str(x) for x in command], cwd=cwd, stdout=stream, stderr=subprocess.STDOUT)
    if result.returncode:
        raise RuntimeError(f'命令失败，查看日志：{log}')


def load(root):
    if not (root / 'work/task.json').is_file():
        raise ValueError('尚未创建制作工作区；开始制作时先运行 pipeline.py init')
    task = read_json(root / 'work/task.json')
    project = root / 'work/project'
    props = project / 'content.json'
    return task, project, props


def validate(root, technical=False):
    task, project, props = load(root)
    log = root / 'work/preview/check.log'
    run(['node', 'scripts/content.cjs', 'validate', props], project, log)
    content = read_json(props)
    video, composition = video_settings(task, content)
    errors = timeline_errors(content, video['fps'])
    for item in outputs(task):
        if item['type'] == 'video' and (item.get('width'), item.get('height')) != (video['width'], video['height']):
            errors.append('实际交付清单的视频尺寸与 video 参数不一致')
    for file in [content['voiceover']['file']] + [s['file'] for s in content['sfx']]:
        if file and not inside(project / 'public', file).is_file():
            errors.append(f'素材缺失：{file}')
    if content['voiceover']['file'] and not errors:
        meta = probe(inside(project / 'public', content['voiceover']['file']))
        if not any(s['codec_type'] == 'audio' for s in meta['streams']):
            errors.append('voiceover.file 不包含音频流')
        if abs(float(meta['format']['duration']) - video['duration_seconds']) > 0.1:
            errors.append('配音时长与成片时长差超过 0.1 秒；请重排时间轴，必要的留白需先制作进音轨')
    if errors:
        raise ValueError('；'.join(errors))
    if technical:
        run(['npm', 'run', 'typecheck'], project, log)
        result = subprocess.run([str(project / 'node_modules/.bin/remotion'), 'compositions', 'src/index.ts', f'--props={props}'],
                                cwd=project, capture_output=True, text=True)
        with log.open('a', encoding='utf-8') as stream:
            stream.write(result.stdout + result.stderr)
        if result.returncode:
            raise RuntimeError(f'合成加载失败：{log}')
        import re
        match = re.search(rf'^\s*{composition}\s+(\d+)\s+\d+x\d+\s+(\d+)', result.stdout, re.M)
        if not match or int(match[1]) != video['fps'] or int(match[2]) != video['duration_in_frames']:
            raise ValueError('实际视频合成帧率或总帧数与 task.json 不一致')
        for item in outputs(task):
            if item['type'] == 'cover' and COVERS[(item['width'], item['height'])] not in result.stdout:
                raise ValueError('实际封面合成缺失')
    report = {'ok': True, 'checked_at': now(), 'scope': 'project' if technical else 'parameters',
              'input_fingerprint': fingerprint(project, task), 'visual_review': 'not_run', 'audio_review': 'not_run'}
    write_json(root / 'work/preview/check-report.json', report)
    return task, project, props, content, video, composition


def remotion(project, mode, composition, destination, props, extra=()):
    destination.parent.mkdir(parents=True, exist_ok=True)
    run([project / 'node_modules/.bin/remotion', mode, 'src/index.ts', composition, destination,
         f'--props={props}', *extra], project, destination.parent / 'render.log')


def init(root, install):
    source, project = root / SOURCE_REL, root / 'work/project'
    if not source.is_dir():
        raise ValueError(f'工程模板不存在：{source}')
    project.mkdir(parents=True, exist_ok=True)
    existing = [p for p in project.iterdir() if p.name != '.gitkeep']
    if not existing:
        shutil.copytree(source, project, ignore=IGNORED, dirs_exist_ok=True)
    elif not (project / 'package.json').is_file():
        raise ValueError('work/project 已有文件但不是可识别的工程，停止复制以免覆盖')
    for directory in ('input/audio', 'input/images', 'input/videos', 'input/text', 'preview', 'delivery'):
        (root / 'work' / directory).mkdir(parents=True, exist_ok=True)
    task_path = root / 'work/task.json'
    if not task_path.exists():
        write_json(task_path, read_json(TASK_TEMPLATE))
    # 已有工程不进行覆盖式更新；用户修改与历史工作完整保留。
    if install:
        run(['npm', 'ci', '--no-audit', '--no-fund'], project, root / 'work/preview/install.log')
    if not (project / 'content.json').exists() and (project / 'node_modules/typescript').exists():
        run(['node', 'scripts/content.cjs', 'export', project / 'content.json'], project, root / 'work/preview/init.log')
    return {'project': str(project), 'content_created': (project / 'content.json').is_file(),
            'next_action': '适配 content.json 与 task.json；依赖未安装时重跑 init --install'}


def preview(root, frames):
    task, project, props, content, video, composition = validate(root, technical=True)
    target = root / 'work/preview'
    size = [f"--width={video['width']}", f"--height={video['height']}"]
    selected = {0, video['duration_in_frames'] - 1}
    for scene in content['scenes']:
        for sec in (scene['start'], (scene['start'] + scene['end']) / 2, max(scene['start'], scene['end'] - 1 / video['fps'])):
            selected.add(min(video['duration_in_frames'] - 1, int(sec * video['fps'])))
    for frame in sorted(selected):
        remotion(project, 'still', composition, target / f'frame-{frame:06}.png', props, [f'--frame={frame}', *size])
    if frames:
        try:
            start, end = map(int, frames.split('-'))
        except ValueError:
            raise ValueError('--frames 应为 START-END（含首尾帧）') from None
        if not 0 <= start <= end < video['duration_in_frames']:
            raise ValueError('预览帧范围超出成片')
        remotion(project, 'render', composition, target / 'clip.mp4', props, [f'--frames={frames}', *size])
    return {'preview': str(target), 'frames': len(selected), 'clip': bool(frames)}


def render(root, only):
    task, project, props, content, video, composition = validate(root, technical=True)
    current = fingerprint(project, task)
    manifest_path = root / 'work/preview/render-manifest.json'
    manifest = read_json(manifest_path) if manifest_path.exists() else {}
    records = manifest.get('outputs', {}) if manifest.get('input_fingerprint') == current else {}
    for item in outputs(task):
        if only != 'all' and (item['type'] == 'video') != (only == 'video'):
            continue
        destination = inside(root, item['path'])
        temporary = destination.with_name('.rendering-' + destination.name)
        try:
            if item['type'] == 'video':
                remotion(project, 'render', composition, temporary, props,
                         [f"--width={video['width']}", f"--height={video['height']}", '--codec=h264', '--audio-codec=aac'])
            else:
                remotion(project, 'still', COVERS[(item['width'], item['height'])], temporary, props, ['--frame=0'])
            errors = verify_file(temporary, item, video, content)
            if errors:
                raise RuntimeError(f"{item['path']}：{'；'.join(errors)}")
            temporary.replace(destination)
            records[item['path']] = {'sha256': sha256(destination), 'rendered_at': now()}
            write_json(manifest_path, {'input_fingerprint': current, 'outputs': records})
        finally:
            temporary.unlink(missing_ok=True)
    return {'outputs': list(records), 'visual_review': 'not_run', 'audio_review': 'not_run'}


def verify(root):
    task, project, props, content, video, composition = validate(root)
    manifest = read_json(root / 'work/preview/render-manifest.json')
    errors, checked = [], []
    if manifest.get('input_fingerprint') != fingerprint(project, task):
        errors.append('输入、工程或本期参数已变化，交付文件需要重新渲染')
    for item in outputs(task):
        path = inside(root, item['path'])
        issues = verify_file(path, item, video, content)
        record = manifest.get('outputs', {}).get(item['path'])
        if not record or not path.is_file() or sha256(path) != record.get('sha256'):
            issues.append('缺少本轮渲染记录或文件已变更')
        checked.append({'path': item['path'], 'ok': not issues, 'errors': issues})
        errors.extend(f"{item['path']}：{error}" for error in issues)
    report = {'ok': not errors, 'checked_at': now(), 'scope': 'delivery_technical', 'files': checked,
              'errors': errors, 'visual_review': 'not_run', 'audio_review': 'not_run'}
    write_json(root / 'work/preview/delivery-check.json', report)
    if errors:
        raise RuntimeError('；'.join(errors))
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument('--root', type=Path, default=ROOT, help='模板根目录，默认从脚本位置推导')
    commands = parser.add_subparsers(dest='command', required=True)
    for name in ('env', 'validate', 'check', 'verify'):
        commands.add_parser(name, allow_abbrev=False)
    p = commands.add_parser('init', allow_abbrev=False)
    p.add_argument('--install', action='store_true', help='在本期工程执行 npm ci')
    p = commands.add_parser('preview', allow_abbrev=False)
    p.add_argument('--frames', help='另外渲染带声音的指定帧范围，如 210-239')
    p = commands.add_parser('render', allow_abbrev=False)
    p.add_argument('--only', choices=('all', 'video', 'covers'), default='all')
    args = parser.parse_args(argv)
    root = args.root.resolve()
    try:
        if args.command == 'env':
            missing = [x for x in ('node', 'npm', 'python3', 'ffmpeg', 'ffprobe') if not shutil.which(x)]
            if missing:
                print(json.dumps({'ok': False, 'errors': missing}, ensure_ascii=False))
                return 3
            result = {'commands': 'available', 'api_key_required': False, 'webgl': 'not_checked'}
        elif args.command == 'init':
            result = init(root, args.install)
        elif args.command in ('validate', 'check'):
            validate(root, technical=args.command == 'check')
            result = {'report': str(root / 'work/preview/check-report.json')}
        elif args.command == 'preview':
            result = preview(root, args.frames)
        elif args.command == 'render':
            result = render(root, args.only)
        else:
            result = verify(root)
        print(json.dumps({'ok': True, **result}, ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, TypeError, RuntimeError, subprocess.SubprocessError) as error:
        code = 5 if isinstance(error, (ValueError, KeyError, TypeError)) else 7
        report = {'ok': False, 'command': args.command, 'error': str(error), 'checked_at': now()}
        # 将失败也落盘，防止上一次成功报告被误认为本次通过。
        if (root / 'work/task.json').is_file():
            write_json(root / 'work/preview/last-command.json', report)
            if args.command in ('validate', 'check', 'verify'):
                write_json(root / ('work/preview/delivery-check.json' if args.command == 'verify' else 'work/preview/check-report.json'), report)
        print(json.dumps(report, ensure_ascii=False))
        return code


if __name__ == '__main__':
    sys.exit(main())
