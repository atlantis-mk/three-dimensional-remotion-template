---
schema_version: "1.0"
id: "three-dimensional-remotion"
name: "三维画面视频模板"
version: "0.4.2"
description: "由 AI 复用三维微缩商业讲解工程，根据本期素材适配文案、画面与配音，制作视频及配套封面。"
status: "ready"
engine: "remotion"
scope: "single-video"
tags:
  - "三维画面"
  - "微缩场景"
  - "商业讲解"
  - "配音视频"
entrypoints:
  instructions: "AGENTS.md"
  skill: ".agents/skills/make-video/SKILL.md"
  template: ".agents/skills/make-video/references/template.md"
paths:
  reference: ".agents/skills/make-video/assets/reference/"
  source: ".agents/skills/make-video/assets/project-template/"
  workspace: "work/"
  input: "work/input/"
  delivery: "work/delivery/"
accepted_inputs:
  - "audio"
  - "image"
  - "video"
  - "text"
video_aspect_ratios:
  - "16:9"
  - "9:16"
capabilities:
  landscape_video: "verified"
  portrait_video: "verified"
  content_parameters: "verified"
  voiceover_input: "available"
  image_video_inputs: "requires_adaptation"
  cover_outputs: "verified"
  project_initialization: "verified"
  timeline_validation: "verified"
  delivery_technical_checks: "verified"
  automatic_voiceover_generation: "not_implemented"
  automatic_audio_alignment: "not_implemented"
reference_files:
  landscape_intro: ".agents/skills/make-video/assets/reference/landscape-intro.png"
  landscape_scene: ".agents/skills/make-video/assets/reference/landscape-scene.png"
  landscape_outro: ".agents/skills/make-video/assets/reference/landscape-outro.png"
  portrait_scene: ".agents/skills/make-video/assets/reference/portrait-scene.png"
default_deliverables:
  - filename: "video.mp4"
    type: "video"
  - filename: "cover-4x3.png"
    type: "cover"
    aspect_ratio: "4:3"
    width: 1600
    height: 1200
  - filename: "cover-3x4.png"
    type: "cover"
    aspect_ratio: "3:4"
    width: 1200
    height: 1600
  - filename: "cover-16x9.png"
    type: "cover"
    aspect_ratio: "16:9"
    width: 1920
    height: 1080
---

# 三维画面视频模板

## 模板用途

本目录对应一期视频。AI 读取制作规则和参考模板，根据用户提供的配音、图片、视频或文案，完成视频制作、检查、渲染和封面交付。

当前为可用参考模板（`ready`）：`.agents/skills/make-video/assets/project-template/` 已包含实际工程、锁文件及音效素材；`.agents/skills/make-video/assets/reference/` 保留横竖屏参考关键帧；示例视频不随仓库提供。默认工程为 60 秒、30fps，同时提供横屏和竖屏配置。

工程提供横竖屏视频及三种独立封面入口，并配有初始化、参数检查、预览、渲染和交付技术检查脚本。`ready` 表示基础工程已可运行、可参考；新主题模型、图片与视频接入、真实配音时间轴仍需 AI 适配。具体能力和实际验证范围见元数据 `capabilities` 与模板说明。

## 适用场景

适合用三维微缩场景讲解小店经营、规模扩张、品牌连锁、融资和股份等商业概念，也可沿用相同镜头语言扩展其他题材。模板采用正交视角、柔和阴影、灰蓝背景、红色重点、指标卡及底部字幕。

当前示例是“从煎饼摊到上市公司”。文字和数值可参数化替换；更换题材时，应同步适配三维模型及画面内容。详细映射见 `.agents/skills/make-video/references/template.md`。

## 素材要求

接受配音、音乐、图片、视频和文字，不要求所有类型齐全。原始素材保存在 `work/input/` 对应分类中。AI 先检查现有素材，再集中询问影响制作的缺失信息，包括尚未明确的视频横屏或竖屏。

旁白可通过工程的 `voiceover` 参数接入，默认示例不含旁白。字幕和分镜已有时间轴，但不会随新配音自动对齐。用户图片、视频需由 AI 接入本期工程，并检查它们与三维场景的组合方式。

## 默认交付

交付 `work/delivery/video.mp4`，以及 `4:3`、`3:4`、`16:9` 三张 PNG 封面。视频比例由本期需求决定，封面比例独立设置。用户明确提出其他交付要求时，以本期要求为准。

工程注册横屏 `Main`、竖屏 `MainVertical`，以及独立封面 `Cover4x3`、`Cover3x4`、`Cover16x9`。封面沿用本期三维主体，按比例分别排版；标题、说明和选景由 `content.cover` 设置。

## 制作入口

AI 从根目录 `AGENTS.md` 开始执行。本目录只制作一期视频。初始不附带 `work/`；开始制作时自动创建，工作文件统一放在其中，不创建多期任务目录。

用户提供主题或文案、横竖方向和现有素材后，AI 按规则连续完成分镜、工程适配、预览、修正、渲染和验收，必要信息齐全时无需逐阶段确认。配音、图片、视频无需全部提供；自带配音与无配音流程不要求配音服务 Key。

最短说明见 `使用说明.md`，模块职责见 `docs/architecture.md`。维护者可运行 `python3 .agents/skills/make-video/scripts/pipeline.py env` 检查环境，具体命令见技能参考。模板维护与测试不会自动启动或完成本期任务。

软件收录时读取本文件开头的 YAML 元数据。格式约定见 `.agents/skills/make-video/references/readme-format.md`；元数据中的所有路径均相对于本文件所在目录。
