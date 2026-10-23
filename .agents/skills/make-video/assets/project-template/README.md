# 三维微缩商业讲解 · 60 秒 Remotion 模板

风格与结构来自参考模板「三维微缩商业讲解」（三维微缩场景、摊车组装、规模扩张、金币、上台阶、字幕、指标卡、音效），扩展为 60 秒、横竖双版本，文字与数字全部参数化。

## 使用

整个文件夹可复制到任意位置独立使用（不引用文件夹外任何路径）：

```sh
npm ci
npm run dev            # Remotion Studio，http://localhost:3077
npm run typecheck      # tsc --noEmit
npm run render         # out/video-16x9.mp4（Main，1920×1080）
npm run render:vertical # out/video-9x16.mp4（MainVertical，1080×1920）
npx remotion still src/index.ts Main out/frame.png --frame=600
```

需要浏览器 WebGL；remotion.config.ts 默认用 `angle`，无 GPU 的 Linux 可改 `swangle`。

## 合成

| id | 尺寸 | 帧率 | 时长 |
|---|---|---|---|
| Main | 1920×1080 | 30 | 60 秒 / 1800 帧 |
| MainVertical | 1080×1920 | 30 | 60 秒 / 1800 帧 |
| Cover4x3 | 1600×1200 | 静帧 | 1 帧 |
| Cover3x4 | 1200×1600 | 静帧 | 1 帧 |
| Cover16x9 | 1920×1080 | 静帧 | 1 帧 |

时长由 `durationInSeconds` 决定。叠层以 1280×720（横）/720×1280（竖）为设计基准自动缩放；竖版布局见 `src/layout.css`。

## 参数（src/content.ts，zod schema + defaultContent）

Studio 右侧可直接编辑；渲染时可用 `--props=my.json` 覆盖。时间单位均为秒。

- `durationInSeconds`、`brand`、`edition`、`accentColor`、`stallSign`（摊车招牌字）
- `intro` / `outro`：开场与结尾大标题（eyebrow、titleBefore、titleHighlight、titleAfter、tagline）
- `scenes[]`：`section`（叙事段落：开场/问题/解释/演示/对比/总结/结尾）、`kind`（三维画面：intro/stall/expand/chain/funding/shares/compare/ipo/outro）、`start`/`end`、`index`、`label`、`note`、`assumption`、`pills`（流程标签）、`steps[]`（指标卡：at、caption、prefix、value、unit、可选 secondary*，数字自动滚动）
- `subtitles[]`：字幕时间轴 {start, end, text}（与 `60秒配音文案.srt` 一致）
- `scenes[].transition` / `scenes[].animation`：见下文
- `sfx[]` 手动音效、`autoSfx`、`ambient`、`mix` 分类音量、`transitionFrames`
- `voiceover`：可选旁白 {file, volume}，把音频放进 public/ 后填文件名；默认无旁白
- `cover`：可选封面 {title, subtitle, sceneIndex, progress}，三种比例各自排版，选景默认使用主体场景 90% 时刻

intro、stall、expand、ipo 的部分动作做参考区间映射，其他动作还含固定帧时点。改变时长须同时检查 steps、字幕、sfx 与实际动作，不能只改总时长。

参数导出与 schema 校验：`node scripts/content.cjs export content.json`、`node scripts/content.cjs validate content.json`。导出不会覆盖已有文件。本期制作优先使用根目录技能的 pipeline.py，见其 references/remotion.md。

## 转场（scenes[].transition，进入本场景时生效）

- `cut` 硬切；`dissolve` 浅色光晕溶解（出入双向）；`whip` 甩镜（横向位移 + 运动模糊，出入双向）
- `zoom` 推镜穿越（旧场景放大模糊冲出、新场景从放大收回）；`wipe` 强调色斜切色块擦除；`orbit` 三维相机环绕入场
- 转场时长 `transitionFrames`（默认 14 帧）

## 动画（scenes[].animation）

- `assemble` 组装落位（摊车/大楼逐件掉落）；`expand` 复制扩张（1→2→10→100）
- `coinBurst` 金币喷发抛物线落地；`stairRise` 金色台阶逐级升起 + 插旗（非 ipo 场景会在侧边叠加台阶）
- `chartGrow` 按 steps 数值生长的柱状图；`cameraFly` 镜头从远处旋转飞入

## 音效系统（src/sfx.ts）

- 中央音效表：`transitionCues`（每种转场）、`animationCues`（每种动画）、`metricStepCue`（指标切换），`autoSfx: true` 时自动放置
- `sfx[]` 手动追加；`ambient` 开关 60 秒氛围底
- 分类音量 `mix`：transition（whoosh/shimmer/rise）、impact（pop/thud）、money（coin/cash）、ui（click/ding）、ambient，再乘 `master`
- `python3 scripts/make_sfx.py` 仅用标准库重新生成 click/thud/ding/shimmer/cash/ambient

## 文件

- `src/content.ts` 参数与默认文案；`src/Root.tsx` 合成注册；`src/Film.tsx` 叠层/字幕/指标/音轨
- `src/Scenes.tsx` 各场景三维编排；`src/Visuals.tsx` 模型/材质/灯光/镜头库（改编自参考）
- `src/style.css`（参考样式）、`src/layout.css`（强调色与竖版布局）
- `src/sfx.ts` 音效表与分类混音；`scripts/make_sfx.py` 音效生成脚本
- `public/` whoosh/coin/pop/rise（取自参考模板）+ click/thud/ding/shimmer/cash/ambient（脚本生成）
- `60秒配音文案.srt` 配音文案

## 说明

未包含参考模板的旁白/参考音频（授权未核实）。文案中的财务数字仅作示意。
