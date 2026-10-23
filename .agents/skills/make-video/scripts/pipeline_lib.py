"""单期制作的确定性检查。只用 Python 标准库；不判断画面质量或修改任务状态。"""
import hashlib
import json
import math
import struct
import subprocess
from datetime import datetime
from pathlib import Path


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def now():
    return datetime.now().astimezone().isoformat(timespec='seconds')


def inside(base, relative):
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute():
        raise ValueError(f'需要相对路径：{relative!r}')
    path = (Path(base) / relative).resolve()
    if not path.is_relative_to(Path(base).resolve()):
        raise ValueError(f'路径超出允许目录：{relative}')
    return path


def probe(path):
    p = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)],
                       capture_output=True, text=True, check=True)
    return json.loads(p.stdout)


def timeline_errors(content, fps=30):
    errors = []
    duration = content['durationInSeconds']
    tolerance = 0.001
    previous = 0.0
    scenes = content['scenes']
    if not scenes:
        errors.append('scenes 不能为空')
    indexes = set()
    for i, scene in enumerate(scenes):
        start, end = scene['start'], scene['end']
        if not 0 <= start < end <= duration + tolerance:
            errors.append(f'scenes[{i}] 范围不合法')
        if abs(start - previous) > tolerance:
            errors.append(f'scenes[{i}] 与上一场景不连续或重叠')
        if scene['index'] in indexes:
            errors.append(f'scenes[{i}] index 重复')
        indexes.add(scene['index'])
        previous = end
        at = -1
        for j, step in enumerate(scene['steps']):
            if not 0 <= step['at'] < end - start or step['at'] < at:
                errors.append(f'scenes[{i}].steps[{j}] 超出场景或未按时间排序')
            at = step['at']
    if scenes and abs(previous - duration) > tolerance:
        errors.append('场景未覆盖完整成片时长')
    previous = 0
    for i, sub in enumerate(content['subtitles']):
        if not 0 <= sub['start'] < sub['end'] <= duration + tolerance:
            errors.append(f'subtitles[{i}] 范围不合法')
        if sub['start'] < previous - tolerance:
            errors.append(f'subtitles[{i}] 重叠或未排序')
        if not sub['text'].strip():
            errors.append(f'subtitles[{i}] 文字为空')
        previous = sub['end']
    for i, sfx in enumerate(content['sfx']):
        if not 0 <= sfx['at'] < duration:
            errors.append(f'sfx[{i}] 超出成片时长')
    cover_index = content.get('cover', {}).get('sceneIndex', min(1, len(scenes) - 1))
    if not 0 <= cover_index < len(scenes):
        errors.append('cover.sceneIndex 不存在')
    return errors


def video_settings(task, content):
    video = task['video']
    for key in ('width', 'height', 'fps', 'duration_seconds', 'duration_in_frames'):
        value = video.get(key)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value <= 0:
            raise ValueError(f'work/task.json 的 video.{key} 尚未确定或不合法')
    for key in ('width', 'height', 'duration_in_frames'):
        if int(video[key]) != video[key]:
            raise ValueError(f'video.{key} 必须为整数')
    if abs(video['duration_seconds'] - content['durationInSeconds']) > 0.001:
        raise ValueError('task.json 与 content.json 的时长不一致')
    frames = math.floor(video['duration_seconds'] * video['fps'] + 0.5)
    if frames != video['duration_in_frames']:
        raise ValueError('video.duration_in_frames 与时长、帧率不一致')
    ratio = video.get('aspect_ratio', '')
    try:
        a, b = map(float, ratio.split(':'))
        if a <= 0 or b <= 0 or abs(a / b - video['width'] / video['height']) > 0.001:
            raise ValueError()
    except (ValueError, AttributeError, ZeroDivisionError):
        raise ValueError('video.aspect_ratio 与尺寸不一致') from None
    composition = 'MainVertical' if video['height'] > video['width'] else 'Main'
    specified = task.get('project', {}).get('composition_id')
    if specified and specified != composition:
        raise ValueError('project.composition_id 与视频方向不一致')
    return video, composition


def outputs(task):
    # 空清单表示默认交付；非空时严格按本期明确的实际清单执行。
    if task.get('deliverables'):
        result = []
        seen = set()
        for item in task['deliverables']:
            path = item['path']
            if Path(path).is_absolute() or Path(path).parent.as_posix() != 'work/delivery' or path in seen:
                raise ValueError('交付项须为 work/delivery/ 内不重复的直接文件')
            seen.add(path)
            if item['type'] not in ('video', 'cover'):
                raise ValueError('交付类型仅支持 video / cover')
            if item['type'] == 'cover' and (item['width'], item['height']) not in ((1600, 1200), (1200, 1600), (1920, 1080)):
                raise ValueError('自定义封面尺寸需先扩展封面入口与脚本映射')
            suffix = '.mp4' if item['type'] == 'video' else '.png'
            if Path(path).suffix != suffix:
                raise ValueError(f'交付文件扩展名应为 {suffix}')
            result.append(item)
        return result
    video = task['video']
    return [dict(path='work/delivery/video.mp4', type='video', width=video['width'], height=video['height']),
            dict(path='work/delivery/cover-4x3.png', type='cover', width=1600, height=1200),
            dict(path='work/delivery/cover-3x4.png', type='cover', width=1200, height=1600),
            dict(path='work/delivery/cover-16x9.png', type='cover', width=1920, height=1080)]


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def fingerprint(project, task):
    h = hashlib.sha256()
    for name in ('src', 'public', 'scripts', 'content.json', 'package.json', 'package-lock.json', 'remotion.config.ts'):
        path = project / name
        files = sorted(p for p in path.rglob('*') if p.is_file()) if path.is_dir() else [path]
        for file in files:
            if file.is_file():
                h.update(file.relative_to(project).as_posix().encode())
                h.update(sha256(file).encode())
    h.update(json.dumps({'video': task['video'], 'deliverables': outputs(task)}, sort_keys=True).encode())
    return h.hexdigest()


def verify_file(path, item, video, content):
    errors = []
    if not path.is_file():
        return ['文件不存在']
    if item['type'] == 'cover':
        with open(path, 'rb') as stream:
            head = stream.read(24)
        if len(head) < 24 or head[:8] != b'\x89PNG\r\n\x1a\n':
            return ['不是有效 PNG']
        if struct.unpack('>II', head[16:24]) != (item['width'], item['height']):
            errors.append('封面尺寸不符')
    else:
        meta = probe(path)
        vs = next((s for s in meta['streams'] if s['codec_type'] == 'video'), None)
        audio = next((s for s in meta['streams'] if s['codec_type'] == 'audio'), None)
        if not vs:
            return ['缺少视频流']
        if (vs['width'], vs['height']) != (video['width'], video['height']):
            errors.append('视频尺寸不符')
        num, den = map(int, vs['avg_frame_rate'].split('/'))
        if abs(num / den - video['fps']) > 0.001:
            errors.append('视频帧率不符')
        if abs(float(vs.get('duration', meta['format']['duration'])) - video['duration_seconds']) > 1 / video['fps'] + 0.01:
            errors.append('视频时长不符')
        expected_audio = (content['voiceover']['file'] and content['voiceover']['volume'] > 0) or (
            content['mix']['master'] > 0 and (content['ambient'] or content['autoSfx'] or content['sfx']))
        if expected_audio and not audio:
            errors.append('预期音轨缺失')
        if audio and abs(float(audio.get('duration', meta['format']['duration'])) - video['duration_seconds']) > 0.1:
            errors.append('音视频时长差超过 0.1 秒')
    # 对图片与视频都实际解码，避免只通过文件头/ffprobe 检查。
    decoded = subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(path), '-f', 'null', '-'], capture_output=True, text=True)
    if decoded.returncode:
        errors.append('完整解码失败：' + decoded.stderr[-400:])
    return errors
