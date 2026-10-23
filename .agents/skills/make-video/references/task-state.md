# 本期任务状态

模板初始不包含 `work/`。开始制作时 `pipeline.py init` 从技能 `assets/task-template.json` 创建空白状态，已有状态不覆盖。`work/task.json` 是本期制作的单一状态记录，使用 UTF-8 JSON。字段名固定为英文，说明文本可用中文。未知值使用 `null` 或空数组，不将占位内容当成实际文件、参数或已完成结果。

## 顶层字段

| 字段 | 用途 |
| --- | --- |
| `schema_version` | 当前为 `"1.0"` |
| `status` | `not_started`、`in_progress`、`waiting_for_input`、`blocked`、`completed` |
| `stage` | `intake`、`planning`、`production`、`preview`、`delivery` |
| `updated_at` | 实际更新时间，使用带时区的 ISO 8601 字符串；未开始可为 `null` |
| `brief` | `topic`、`title`、`requirements`、`assumptions`；区分明确要求与采用的默认方案 |
| `video` | `aspect_ratio`、`width`、`height`、`fps`、`duration_seconds`、`duration_in_frames` |
| `audio` | `voiceover`、`music`；未提供或不使用时为 `null`，使用时记录根目录相对文件路径 |
| `assets` | 实际素材及其用途清单 |
| `timeline` | 分镜与时间安排 |
| `cover` | `title`、`concept`，描述封面标题和构图主题 |
| `project` | 本期工程的 `path`、实际 `entrypoint` 与 `composition_id`；生成本期参数文件后增加 `props_file`，注册封面后可增加 `cover_compositions` |
| `deliverables` | 本期解析后的实际交付项，不在空白初始状态中伪造已经确定的参数 |
| `completed_stages` | 已通过完成条件的阶段名，不代表仅仅开始过该阶段 |
| `open_questions` | 需要用户回答的问题数组；已回答的问题应移除，并将答案写入相应参数 |
| `issues` | 阻塞或待修正事项数组 |
| `checks` | 实际执行过的检查与结果 |
| `artifacts` | 已经生成且实际存在的中间产物或交付文件 |
| `next_action` | 恢复任务时应执行的具体下一步 |

## 素材记录

`assets` 中每项至少记录：`path`（根目录相对路径）、`type`（`audio`、`image`、`video`、`text`）、`purpose`。可补充 `duration_seconds`、`width`、`height`；未实际测量的值保持 `null`。

## 分镜记录

`timeline` 中每项至少包含：`id`、`description`、`start_frame`、`duration_in_frames`、`assets`（素材路径数组）。可以增加 `caption`、`voiceover_segment` 等有助于同步的字段。确定帧率后再填实际帧数，保证分镜范围在成片内；转场重叠应明确说明。

## 交付记录

`deliverables` 在需求明确后，从 README 默认值与用户本次要求解析生成。每项包含 `path`、`type`、`aspect_ratio`、`width`、`height`；视频还可包含实际 `duration_seconds`。路径相对于根目录，默认位于 `work/delivery/`。用户取消或新增交付项时，将原因写入 `brief.requirements`。

`artifacts` 中每项包含 `path`、`kind`（`preview`、`frame`、`video`、`cover` 等）、`stage`、`created_at`。只有文件实际存在时才能加入。

`project.props_file` 为完整本期参数 JSON 的根目录相对路径，默认 `work/project/content.json`。`project.cover_compositions` 如使用则为数组，每项记录实际的 `id`、`width`、`height`、`aspect_ratio` 和要使用的 `frame`；不得记录尚未实现的合成 ID。

基准工程现有 `Cover4x3`、`Cover3x4`、`Cover16x9`，合成输出帧均为 0；场景内定格由 `content.cover` 决定。封面场景进度不是输出帧号。

## 检查与推进

`checks` 每项包含 `name`、`status`（`passed`、`failed`、`not_run`）、`details`、`checked_at`，可补充 `path` 指明检查对象。文字解释要对应实际观察或工具结果，未执行的检查不能写成通过。

更新状态时保留仍有效的用户要求和结果，保证 JSON 始终有效。用户仅要求目录初始化时保留 `not_started`，不因为缺少实际模板就把尚未开始的视频任务标成失败。

`pipeline.py init` 仅在缺失时创建空白状态；其他命令不自动推进本期状态。引用 `work/preview/check-report.json`、`delivery-check.json` 时记录其真实检查范围；技术报告的 `visual_review`、`audio_review` 是 `not_run`，不代表已完成查看或收听。`render-manifest.json` 仅为本轮输入与输出的核对证据，不代替阶段验收。

有关键问题等待用户回答时使用 `waiting_for_input`；工程运行或渲染受环境等因素阻塞时使用 `blocked`，并记录具体原因。条件解决后恢复 `in_progress`。

需求变化后，仅保留仍有效的阶段完成记录、产物与检查；对受影响的输出标记为需要更新，避免把旧结果当成本轮结果。只有实际交付清单全部完成且必要检查通过，才使用 `completed`。
