# 制作脚本与 Remotion 入口

脚本位于 `.agents/skills/make-video/scripts/pipeline.py`，只用 Python 标准库。以下命令从模板根目录运行；也可以用脚本绝对路径从任意目录运行，按脚本位置定位根目录。

## 环境与初始化

```sh
python3 .agents/skills/make-video/scripts/pipeline.py env
python3 .agents/skills/make-video/scripts/pipeline.py init --install
```

`env` 检查 node、npm、python3、ffmpeg、ffprobe 是否存在，不要求配音 Key。WebGL 是否可用以实际加载与渲染为准。

模板初始不包含 work。`init` 创建 input 各分类、preview、delivery 和空白 task.json，已有状态不覆盖；只在空白 `work/project/` 复制基准，排除依赖、缓存、历史输出和版本控制目录。重复运行不覆盖已有工程；`--install` 在本期工程执行 `npm ci`。安装后用工程 `scripts/content.cjs export` 从实际 defaultContent 导出完整 `content.json`，已有参数文件不覆盖。

工程和参考素材随技能放在 assets 中；本包仍按根规则与单期 work 使用。可选 `--root DIR` 用于维护验证，放在子命令前；正常制作省略。恢复旧版工作工程时先补齐所需脚本和合成改动，不能覆盖已有本期内容。

## 参数与时间轴

在 `work/project/content.json` 保存完整参数，以工程 `src/content.ts` 为准，不只保存少量差异。任务 `project.props_file` 记录其根目录相对路径。

同时填写 `work/task.json` 的视频比例、宽高、帧率、秒数和总帧数。脚本使用实际尺寸输出，不把未知参数补成已确认要求。帧率继承实际工程，改变帧率须同时修改 config.ts 与任务记录。

```sh
python3 .agents/skills/make-video/scripts/pipeline.py validate
python3 .agents/skills/make-video/scripts/pipeline.py check
```

`validate` 使用工程真实 schema，另查场景连续覆盖全片、起止范围、步骤顺序、字幕重叠、音效范围、封面选景和配音文件。场景依次相接，转场由 transition 实现，不通过重叠场景实现。

steps[].at 是场景相对秒数；场景、字幕的 start/end 是成片绝对秒数；transitionFrames 是帧。缩短场景时仍要检查源码内固定时点的动作是否发生。

`check` 额外执行类型检查和实际合成加载，核对帧率、总帧数和封面入口。报告为 `work/preview/check-report.json`，日志为 check.log。失败写新报告，不沿用旧成功记录。

## 声音与其他素材

原始素材保留在 `work/input/`；使用的旁白复制到本期工程 public，voiceover.file 填 public 内相对路径。裁剪、拼接、留白等派生音轨放本期工程或预览目录。配音与成片时长差超过 0.1 秒时先修时间轴，必要留白可先制作进音轨。

无配音时 voiceover.file 留空，不强制生成旁白。模板不内置 TTS、语音转写、外部音频自动对齐；用户要求生成配音时按可用工具和授权配置制作，关键能力不足则记录实际阻塞。

默认氛围底长 60 秒，时长改变后按需调整、循环或关闭，不能假定自动延长。图片视频展示仍需 AI 在本期代码接入并检查裁剪、加载和声音。

## 预览

```sh
python3 .agents/skills/make-video/scripts/pipeline.py preview
# 仅在本期总帧数大于 239 时使用此例
python3 .agents/skills/make-video/scripts/pipeline.py preview --frames 210-239
```

生成开头、结尾和各场景开始/中间/结束帧；--frames 另生成带声音区间预览。按本期时间轴选择代表区间，必要时直接调用 Remotion 输出更长预览。脚本不判断画面质量或语义同步，必须实际查看、收听。

## 三种封面

默认尺寸集中在 src/presets.ts，独立布局为 src/Cover.tsx。content.cover 是可选对象：

| 字段 | 用途 |
| --- | --- |
| title | 封面标题，省略时拼接开场标题 |
| subtitle | 说明，省略时沿用开场 tagline |
| sceneIndex | scenes 数组下标，从 0 开始 |
| progress | 场景内定格进度，0–0.99，默认 0.9 |

入口为 Cover4x3（1600×1200）、Cover3x4（1200×1600）、Cover16x9（1920×1080）。16:9 左右排版，另两种上下排版，主体来自本期三维场景。实际查看选景，不能使用部件尚未落位的时刻；特殊模型和标题可在本期组件中调整。

## 渲染与交付检查

```sh
python3 .agents/skills/make-video/scripts/pipeline.py render
python3 .agents/skills/make-video/scripts/pipeline.py verify
python3 .agents/skills/make-video/scripts/pipeline.py render --only video
python3 .agents/skills/make-video/scripts/pipeline.py render --only covers
```

task.deliverables 为空时按根规则输出默认四项；非空时严格按明确的实际清单，路径须直接位于 work/delivery。自定义视频尺寸可用；新增封面尺寸须先扩展封面合成和脚本映射。取消封面须记录用户要求与实际清单。

render 先检查工程，输出临时文件，解码核对成功后替换对应正式文件。`work/preview/render-manifest.json` 记录源码、参数、public 素材的摘要及输出哈希；输入变化后 verify 会拒绝沿用旧文件，不能手填渲染清单冒充本轮结果。

verify 检查完整解码、尺寸、帧率、时长、预期音轨及音视频时长差。封面核对 PNG 与尺寸。报告位于 `work/preview/delivery-check.json`，其中 visual_review、audio_review 仍为 not_run；AI 实际查看收听后在任务中另记真实结果。脚本不推进阶段或自动完成任务。

## 维护测试

```sh
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 tests/smoke_pipeline.py
```

先在 .agents/skills/make-video/assets/project-template 安装依赖。单元检查覆盖时间关系、恢复保护、交付覆盖和输入变更。真实渲染验证在临时目录运行横竖短片与三张封面，检查旧输出失效，结果留在 `tests/artifacts/template-check-pipeline-*`，不创建根目录 work，不修改已有本期工程、交付和状态。
