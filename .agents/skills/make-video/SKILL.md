---
name: make-video
description: 复用本项目三维微缩商业讲解 Remotion 模板，根据本期内容与素材制作、修改、预览、渲染视频及三种封面。也用于维护本模板制作工具；仅维护时不启动视频任务。
---

# 按模板制作本期视频

## 入口与职责

定位包含根规则、README 和本技能的项目根目录，初始不要求存在 `work/`。先读根规则、README、本技能的 [references/template.md](references/template.md) 和已有的 `work/task.json`；没有工作区时按新制作处理。当前已有实际工程与参考，不重复索要模板。必要问题、阶段与默认交付以根 `AGENTS.md` 为准。

工程模板与参考素材统一随技能放在 `assets/`，技术规范放在 `references/`，运行工具放在 `scripts/`；根目录保留本包规则，单期工作区在开始制作时创建。当前按整个模板包使用。已有任务先核对实际文件并保留改动。仅维护时不初始化本期工程、不索要素材、不推进本期状态。

## 制作流程

1. 检查素材与需求、参考画面和相关源码；集中补齐影响结果的必要信息。主题、方向已明确时连续推进，不逐阶段确认。
2. 读 [references/task-state.md](references/task-state.md)，记录实际参数、素材用途、分镜和时间轴。配音、图片、视频不要求齐全，不强制新增旁白或音乐。
3. 读 [references/remotion.md](references/remotion.md)，用 `pipeline.py env` 检查环境，首次运行 `init --install` 创建工作区与空白任务状态、复制基准、安装锁定依赖、导出完整 `content.json`。已有工程继续适配，不能覆盖重建。
4. 改写本期参数和场景。换题材时检查 `Scenes.tsx` 与 `Visuals.tsx` 的模型道具，替换招牌不等于题材转换。图片、视频需要展示时在本期代码中接入。
5. 有配音时测量时长，按语义重排场景、字幕、指标和音效。脚本不提供 TTS、转写或自动对齐；自带配音不检查配音服务 Key。schema 或总时长更新不能视为音画对齐。
6. 设置 `content.cover` 文案和选景，三种封面已有独立布局，无需每期重建入口。分别检查主体、标题和边界。
7. 用 `validate` 检查参数、时间关系与声音文件，用 `check` 检查类型和实际合成，用 `preview` 生成关键帧和指定区间带声音预览。实际查看、收听后修正。
8. 用 `render` 输出本期实际交付清单，用 `verify` 解码、核对媒体信息和本轮渲染记录。技术通过后仍须完成根规则视听验收，再更新状态和交付。

脚本末行输出 JSON；退出码 `0` 成功、`2` 用法错误、`3` 环境缺失、`5` 参数不合法、`7` 执行或检查失败。先读报告日志后修正，不设置累计检查次数上限。脚本不会将任务自动标记为 `completed`。

## 按需参考

- 实际模板风格、参数和验证范围：[references/template.md](references/template.md)。工程基准为 `assets/project-template/`，参考关键帧为 `assets/reference/`。

- 初始化、参数、素材、预览、渲染与技术检查：[references/remotion.md](references/remotion.md)。
- 任务恢复、阶段推进与验收记录：[references/task-state.md](references/task-state.md)。
- 修改 README 机器读取元数据：[references/readme-format.md](references/readme-format.md)。
- 模块与维护验证：根目录 `docs/architecture.md`。`tests/` 的证据不属于本期交付。
