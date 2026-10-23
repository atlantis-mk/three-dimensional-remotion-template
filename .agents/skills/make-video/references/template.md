# 三维微缩商业讲解模板说明

## 已提供的参考与工程

本模板以“从一个煎饼摊到上市公司”为默认示例，已经具备可运行 Remotion 工程、音效和参考输出。

以下路径均相对于项目根目录：

| 路径 | 用途 |
| --- | --- |
| `.agents/skills/make-video/assets/reference/landscape-intro.png` | 横屏开场的标题、构图与组装过程参考 |
| `.agents/skills/make-video/assets/reference/landscape-scene.png` | 横屏三维场景、指标卡与字幕参考 |
| `.agents/skills/make-video/assets/reference/landscape-outro.png` | 横屏收尾场景与结尾文字参考 |
| `.agents/skills/make-video/assets/reference/portrait-scene.png` | 竖屏布局、取景与文字分区参考 |
| `.agents/skills/make-video/assets/project-template/` | 原始工程、锁文件、公共音效与音效生成脚本 |
| `.agents/skills/make-video/assets/project-template/60秒配音文案.srt` | 默认示例字幕与配音文案，不是音频文件 |

此前历史输出已随用户要求删除 work 清理；静态参考关键帧仍保留，使用以上标准参考路径。参考截图是具体动画时刻，漂浮或分离的部件可能属于组装过程，应结合动画源码与本地预览判断。

## 实际运行入口

- 包管理器：npm；复用 `package-lock.json`，已有锁文件时使用 `npm ci` 安装。
- 依赖：Remotion、`@remotion/cli`、`@remotion/three` 均为 `4.0.535`；使用 React、Three.js 和 React Three Fiber 实现三维画面。以实际 `package.json` 与锁文件为准。
- 入口：`src/index.ts` → `src/Root.tsx` → `src/Film.tsx`。
- `Main`：`1920×1080`、30fps，默认 60 秒 / 1800 帧。
- `MainVertical`：`1080×1920`、30fps，默认 60 秒 / 1800 帧。
- `Cover4x3`、`Cover3x4`、`Cover16x9`：独立静帧，尺寸为 1600×1200、1200×1600、1920×1080，均使用本期完整 content 参数。
- 默认视频与封面尺寸集中在 `src/presets.ts`；`src/Cover.tsx` 分别排版，并用 `World.stillFrame/stillFps` 明确定格。静帧入口固定 1fps，选景按视频实际 FPS 计算，不能将二者混用。
- `calculateMetadata` 根据 `durationInSeconds` 计算总帧数；帧率由 `src/config.ts` 的 `FPS` 确定。
- `remotion.config.ts` 使用 Chromium `angle` 渲染器，三维画面需要可用的 WebGL。

`package.json` 保留原有开发与渲染命令，默认输出在工程 `out/`。本期优先使用技能 `scripts/pipeline.py`，自动定向到 `work/preview/` 或 `work/delivery/`；操作方法见技能参考。

## 应继承的视觉与叙事特征

| 项目 | 实际特征 |
| --- | --- |
| 视觉风格 | 微缩模型、正交斜俯视、柔和光照和接触阴影，带轻微颗粒与暗角 |
| 色彩 | 灰蓝背景、浅色台面、红色重点及金色金币；`accentColor` 主要控制二维重点，部分模型仍使用源码中的固定色 |
| 模型 | 摊车、人物、街灯、树木、金币、公司楼、股份方块、台阶与旗帜 |
| 叙事顺序 | 开场 → 问题 → 解释 → 演示 → 对比 → 总结 → 结尾；默认用 9 个场景承载 |
| 镜头与转场 | 推拉、旋转及 `cut`、`dissolve`、`whip`、`zoom`、`wipe`、`orbit` 六种转场 |
| 动画 | `assemble`、`expand`、`coinBurst`、`stairRise`、`chartGrow`、`cameraFly`；部分动画附着在固定模型上 |
| 文字 | 顶部品牌与版本标识、章节标签、滚动数值指标卡、底部字幕与口径说明 |
| 横竖适配 | 横版设计基准 `1280×720`，竖版 `720×1280`；通过相机与 `layout.css` 分别调整 |
| 声音 | 转场、动作、指标切换自动音效与可选氛围底；默认无旁白 |

当前九种 `kind` 为 `intro`、`stall`、`expand`、`chain`、`funding`、`shares`、`compare`、`ipo`、`outro`。新内容优先复用表达方式，必要时在本期工程中扩展场景和模型。

## 参数与源码修改位置

参数 schema 与默认值集中在 `src/content.ts`。AI 应以实际 `contentSchema` 和 `defaultContent` 为准，生成本期完整参数文件 `work/project/content.json`，通过 `--props=content.json` 接入。

| 目标 | 修改位置或参数 |
| --- | --- |
| 品牌、版本、招牌、二维强调色 | `brand`、`edition`、`stallSign`、`accentColor` |
| 开场和收尾标题 | `intro`、`outro` 的完整对象 |
| 总时长 | `durationInSeconds`；同时检查分镜、字幕、音效与音轨 |
| 场景和节奏 | `scenes[]` 的 `kind`、`section`、`start`、`end`、`transition`、`animation` |
| 指标和说明 | 场景中的 `steps`、`label`、`note`、`pills`、`assumption` |
| 字幕 | `subtitles[]` 的 `start`、`end`、`text` |
| 配音 | `voiceover.file`、`voiceover.volume`；文件复制到本期工程 `public/` |
| 封面标题、说明与定格 | `cover.title`、`cover.subtitle`、`cover.sceneIndex`、`cover.progress`；未填时继承本期文案并选择主体场景 |
| 音效 | `autoSfx`、`sfx[]`、`ambient`、`mix`、`transitionFrames`；细节在 `src/sfx.ts` |
| 人物、摊车、道具和场景 | `src/Visuals.tsx` 与 `src/Scenes.tsx`，并非仅靠 props 就能变成任意题材 |
| 叠层和素材接入 | `src/Film.tsx`，以及 `src/style.css`、`src/layout.css` |
| 默认尺寸与封面 | `src/presets.ts`、`src/Cover.tsx`、`src/Root.tsx` |

时间轴单位为秒；`steps[].at` 是相对本场景开始的时间。分镜与字幕的 `start` / `end` 是成片绝对时间。不能混用。

## 本期适配时必须处理的事项

1. 逐项替换默认故事的标题、字幕、指标及假设数字。示例数字仅用于解释，不自动成为本期事实。
2. 新题材需要相应模型时，在本期工程内调整模型或场景。将“煎饼果子”改成“咖啡小店”，不会自动把煎饼摊变成咖啡店。
3. 新配音接入后，核实长度与语义段落，再安排场景、字幕、指标和声音；当前没有自动转写或自动音画对齐实现。
4. 只有 `intro`、`stall`、`expand`、`ipo` 的部分动画使用参考帧区间映射，其他动作也包含固定本地帧时点。显著缩短场景时，要检查关键动作是否来得及发生。
5. 用户图片、视频当前没有统一参数入口；由 AI 在本期工程实现叠层、展示平面或镜头素材，并处理裁剪、加载与声音。
6. 三种封面已有入口和独立布局。AI 设置本期文案与主体选景，再逐张查看。新主题的三维道具和模型仍要同步适配，现成封面入口不代表构图自动验收通过。
7. 内置氛围音轨长度为 60 秒；时长变化时按实际需求调整、循环或关闭，不假定会自动铺满。
8. schema 检查类型和数值范围；`pipeline.py validate` 另外检查连续性、起止、字幕和指标范围。语义对应、固定时点动作和实际声画同步仍须 AI 检查。

## 已完成的基础验证

以下是历史验证记录，当时 work 内的维护产物已随用户要求清理，不再随包附带。今后的维护验证输出到 tests/artifacts，制作工作区只在开始制作时创建。

验证日期：2026-10-22。

- `npm run typecheck` 通过。
- `npm run compositions` 成功列出 `Main` 和 `MainVertical`。
- 原有横屏示例媒体信息为 H.264、`1920×1080`、30fps、约 60 秒，并包含 AAC 音轨。
- 将文案、招牌和二维强调色替换为“咖啡小店”后，两个合成分别渲染了第 `210–239` 帧，横屏和竖屏各 1 秒，输出包含音轨并完整解码通过；已查看相应输出画面。
- 参数复用检查产物位于 `work/preview/template-check-*`，属于验证材料，不是本期交付。

验证范围是基础工程加载与短片参数替换，不代表新主题模型、真实旁白同步、用户图片与视频、三种封面或新一期完整成片已经通过验收。本次模板说明维护不推进 `work/task.json` 的本期制作状态。

### 0.3.0 工具与封面验证

验证日期：2026-10-23。以下是本次维护结果，独立于上述 2026-10-22 记录。

- 基准类型检查、技能格式检查、README 元数据和引用路径检查通过；依赖锁文件通过 npm ci dry-run 核对。
- 5 项单元测试通过，覆盖初始化保留已有改动、场景与字幕错误、任务参数一致性、交付清单覆盖、素材变化使旧记录失效。
- 临时工程经 init 导出完整参数，check 加载两种视频和三种封面入口。横屏 1920×1080、竖屏 1080×1920 分别真实渲染 1 秒 / 30 帧；完整解码、时长、帧率及音轨技术检查通过，并查看了两种输出的中后段截图。
- 三张封面按默认完整尺寸真实渲染并逐张查看，主体、文案和比例布局可见；修正了静帧 1fps 导致选景停在组装初期的问题，并实际验证两种 progress 产生不同画面。
- 改变画幅后旧输出被拒绝；缺失旁白文件返回输入错误；检查不要求配音 Key。渲染记录、文件哈希和本轮输入摘要核对通过。
- 维护证据为 `work/preview/template-check-pipeline-*`，报告为 `template-check-pipeline-report.json`。维护未初始化本期 project，未写 delivery，task 保持 not_started。

本轮没有验证真实新主题的完整长片、真实旁白同步、图片视频接入，也没有完成音频收听。技术报告保留 audio_review=not_run，不能据此宣称新一期已完成。自动 TTS、转写与外部配音自动对齐仍未内置。

### 0.4.0 目录迁移验证

2026-10-23：工程迁至技能 `assets/project-template/`，参考成片与关键帧迁至 `assets/reference/`，本说明迁至 `references/template.md`。原始历史输出保留到 `work/preview/template-history/`，根目录旧 template 目录已移除。

同步修改初始化来源、README 元数据、规则、操作说明与维护测试。迁移后 5 项单元测试、技能格式、全部元数据路径检查通过；从新位置初始化的临时工程再次完成横竖各 1 秒与三张封面的真实渲染、解码和本轮记录核对。证据仍为 `work/preview/template-check-pipeline-*`。本期 task 仍为 not_started，project 和 delivery 保持空白。

### 0.4.1 工作区按需创建

模板包移除预建 work。空白任务结构保存在技能 assets/task-template.json，init 首次创建运行目录和状态，已有任务不覆盖。维护测试改用临时工作区，证据输出 tests/artifacts，不重新创建根目录 work。

### 0.4.2 仓库素材精简

按用户要求移除示例视频及其元数据引用，保留三维示例源码、四张横竖参考关键帧和全部内置音效。仓库不再附带示例成片，需观看动画时由工程在本地生成预览。上述成片检查为历史验证结果，不表示仓库当前仍包含该视频文件。
