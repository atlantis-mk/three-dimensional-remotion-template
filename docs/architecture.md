# 模板结构与维护

借鉴 `remotion-video-template` 的技能、脚本、参考、工程与测试分工，保留本项目三维风格和单期 `work/` 约定。

```text
三维画面模板/
├── AGENTS.md
├── README.md
├── 使用说明.md
├── docs/
├── tests/
└── .agents/skills/make-video/
    ├── SKILL.md
    ├── scripts/
    ├── references/
    │   ├── template.md
    │   ├── remotion.md
    │   ├── task-state.md
    │   └── readme-format.md
    └── assets/
        ├── project-template/      Remotion 工程基准
        └── reference/             参考关键帧
```

| 位置 | 职责 |
| --- | --- |
| `AGENTS.md` | 制作规则唯一入口 |
| `README.md` | 模板元数据、能力边界 |
| `使用说明.md` | 最短用户入口 |
| `.agents/skills/make-video/SKILL.md` | 技术流程与按需参考入口 |
| 技能 `references/` | 操作、任务状态、元数据约定 |
| 技能 `scripts/pipeline.py` | env/init/validate/check/preview/render/verify 命令 |
| 技能 `scripts/pipeline_lib.py` | 路径、时间、媒体与渲染记录检查 |
| `.agents/skills/make-video/references/template.md` | 风格、参数映射与验证记录 |
| `.agents/skills/make-video/assets/reference/` | 参考关键帧 |
| `.agents/skills/make-video/assets/project-template/` | 基准工程、依赖锁和音效 |
| 工程 `scripts/content.cjs` | 从真实 schema 校验和导出完整参数 |
| 工程 `src/presets.ts`、`Cover.tsx` | 集中默认尺寸，三比例封面布局 |
| 工程 `Film.tsx`、`Scenes.tsx`、`Visuals.tsx` | 主片、场景、模型 |
| `tests/` | 模板维护测试 |
| `work/task.json` | 本期唯一状态记录 |
| `work/input/` | 用户原始素材 |
| `work/project/` | 本期完整工程与参数 |
| `work/preview/` | 预览、日志与检查证据 |
| `work/delivery/` | 最终视频与封面 |

工程模板、参考素材与说明已统一迁入技能包；根目录不再保留平行的 template 目录。README 元数据指向技能内的实际位置，软件可按路径读取。另一项目的深色信息图、豆包依赖、多期 slug 和发布文案要求不适用于本模板。

模板初始不附带 work，开始制作时从技能 assets/task-template.json 创建运行工作区。此前 work 内的历史输出与验证材料已随用户要求清理，静态参考关键帧仍在技能 assets/reference 中。已安装的 node_modules 属本机依赖，受忽略规则保护，初始化时不会复制进本期工程。

## 执行边界

AI 负责需求、事实依据、分镜、题材转换、素材接入、声音与实际视听验收。脚本负责确定性的文件操作和技术检查；init 仅在缺失时创建空白 task.json，其余命令不推进状态。

检查沿用真实 schema，另查时间关系；初始化不覆盖已有工程；渲染写临时文件，验证成功再替换输出；本轮记录包含源码、参数和音频等素材摘要，防止沿用失效文件。不设置累计检查次数上限。

模板没有 TTS、转写或外部配音自动对齐工具。图片视频展示和新题材模型仍需 AI 按期适配；不能仅凭技术检查成功就宣称内容、构图与语义同步均已验收。

## 维护验证

在 `.agents/skills/make-video/assets/project-template/` 执行 `npm ci`；在根目录运行：

```sh
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 tests/smoke_pipeline.py
```

单元检查不调用付费接口。渲染验证使用临时工作区并复用基准依赖，分别渲染横竖各一秒和三张完整尺寸封面，解码核对并验证旧输出失效。证据按需生成到 `tests/artifacts/template-check-pipeline-*`，另行查看与收听后如实补充验证记录；不创建根目录 work，不写本期交付，也不推进本期状态。
