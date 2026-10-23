# README 元数据格式 v1

## 文件与解析约定

- 文件固定为项目根目录的 `README.md`，使用 UTF-8。
- 第一行必须是 `---`，第二个独立的 `---` 结束 YAML 元数据。用安全 YAML 解析器读取该区块，不执行 YAML 自定义对象。
- 软件读取元数据，不从自然语言正文推断能力、目录或状态。
- YAML 键名、枚举值使用本文约定的英文；名称与说明允许中文。不得出现重复键。
- 相对路径统一使用 `/`，相对于项目根目录，且应保持在项目根目录内。目录路径以 `/` 结尾。
- `schema_version` 是格式版本，`version` 是模板内容版本，两者分别维护。
- 为后续兼容，可增加可选字段；改变已有必填字段含义、类型或移除字段时升级格式版本。读取器应忽略不认识的可选字段，不应将不支持的主版本按 v1 强行读取。

## 必填字段

| 字段 | 类型与要求 |
| --- | --- |
| `schema_version` | 字符串；当前为 `"1.0"` |
| `id` | 稳定、非空的模板标识；小写字母、数字与单连字符组成，改名不改变标识 |
| `name` | 非空字符串，显示名称 |
| `version` | `主版本.次版本.修订版本` 形式的字符串 |
| `description` | 非空字符串，说明模板用途 |
| `status` | `scaffold` 或 `ready`；未具备实际可运行模板时为 `scaffold` |
| `engine` | 本格式中为 `remotion` |
| `scope` | 本格式中为 `single-video` |
| `tags` | 字符串数组 |
| `entrypoints` | 对象，包含 `instructions`、`skill`、`template` 三个文件路径 |
| `paths` | 对象，包含 `reference`、`source`、`workspace`、`input`、`delivery` 五个目录路径 |
| `accepted_inputs` | 去重的字符串数组；可选值 `audio`、`image`、`video`、`text` |
| `video_aspect_ratios` | 去重的字符串数组；本模板默认 `16:9`、`9:16` |
| `default_deliverables` | 非空数组，元素格式见下文 |

`paths.reference` 和 `paths.source` 是随模板提供的静态资源，必须存在；`workspace`、`input`、`delivery` 是制作时生成的运行目录，模板初始可不存在。读取器不要因运行目录尚未创建而将模板判为不可用。

## 交付项格式

每个交付项都包含：

- `filename`：交付目录内的直接文件名，不含目录或路径跳转；同一列表内不可重复。
- `type`：`video` 或 `cover`。

`cover` 另须包含：

- `aspect_ratio`：`宽:高` 形式的字符串。
- `width`、`height`：正整数，且与声明的比例一致。

默认视频尺寸在本期 `work/task.json` 中确定，不在通用元数据中强制固定。

README 的列表是默认交付约定。本期明确覆盖默认值时，在任务记录中保存解析后的实际清单及变更依据，不能偷偷改动模板默认元数据来代替本期配置。

## 可选的能力与参考字段

v1 允许以下可选字段，不改变已有必填字段含义：

- `capabilities`：对象，键是稳定的能力名称；值为 `verified`（已经实际验证）、`available`（已实现入口，尚未完成该能力的完整验证）、`requires_adaptation`（需要 AI 在本期工程中适配或实现）、`not_implemented`（没有现成实现）。能力应按具体粒度记录，不能把基础渲染通过扩大为所有素材、声音与封面均已验证。
- `reference_files`：对象，键是参考用途标识，值为项目根目录相对文件路径。文件应真实存在并随模板收录。不要仅引用不会随模板携带的临时输出或绝对路径。

当前能力名称为 `landscape_video`、`portrait_video`、`content_parameters`、`voiceover_input`、`image_video_inputs`、`cover_outputs`、`automatic_audio_alignment`。软件可按实际需要逐项显示，并忽略不认识的新增能力键。

制作工具另使用 `project_initialization`、`timeline_validation`、`delivery_technical_checks`、`automatic_voiceover_generation`。技术检查已验证不等于内容、视觉、听觉和完整新主题交付均已验证。

## 固定正文栏目

正文按以下顺序保留一级标题和五个二级标题，内容可以更新：

1. 一级标题：与 `name` 一致。
2. `模板用途`
3. `适用场景`
4. `素材要求`
5. `默认交付`
6. `制作入口`

正文用于说明，软件行为以元数据为准。不要在 README 另建与 `AGENTS.md` 冲突的执行规则。

## 可用性判断

软件可收录 `scaffold` 状态的模板，但应将其展示为待补充，而非可以直接制作。将状态改为 `ready` 前，确认实际模板工程存在、参考描述有依据、运行入口可用且完成至少一次真实预览或渲染验证。空目录和文字说明不构成可运行模板。

`ready` 描述基础工程与参考已经就绪，不等于默认交付的所有入口均已预制，也不表示本期任务已经完成。读取器应结合 `capabilities` 判断哪些环节已实现、已验证或仍需 AI 适配。具体验证范围在 `.agents/skills/make-video/references/template.md` 中记录。
