import {z} from 'zod';
import {zColor} from '@remotion/zod-types';

/**
 * 全部文字、数字、时间轴都在这里。时间单位均为「秒」。
 * Studio 右侧面板可直接改这些参数；渲染时也可用 --props=xxx.json 覆盖。
 */

// 一个指标步骤：在场景内 at 秒时切换，数字从上一步的值滚动到 value。
const metricStep = z.object({
  at: z.number().min(0).describe('相对场景开始的秒数'),
  caption: z.string(),
  prefix: z.string().default(''),
  value: z.number(),
  unit: z.string(),
  secondaryPrefix: z.string().default(''),
  secondaryValue: z.number().optional(),
  secondaryUnit: z.string().default(''),
});

// 7 种三维画面，顺序可调、时长可调；每种画面内部的组装/扩张动画按场景时长等比例伸缩。
export const sceneKinds = ['intro', 'stall', 'expand', 'chain', 'funding', 'shares', 'compare', 'ipo', 'outro'] as const;
// 叙事段落（固定顺序）：开场 → 问题 → 解释 → 演示 → 对比 → 总结 → 结尾。每个场景必须标注所属段落。
// 转场类型（进入本场景时的转场）：cut 硬切 / dissolve 溶解 / whip 甩镜 / zoom 推镜穿越 / wipe 色块擦除 / orbit 环绕运镜
export const transitionTypes = ['cut', 'dissolve', 'whip', 'zoom', 'wipe', 'orbit'] as const;
// 动画类型：assemble 组装落位 / expand 复制扩张 / coinBurst 金币喷发 / stairRise 金色台阶升起 / chartGrow 柱状图生长 / cameraFly 镜头飞入
export const animationTypes = ['assemble', 'expand', 'coinBurst', 'stairRise', 'chartGrow', 'cameraFly'] as const;
export const sfxFiles = ['whoosh.wav', 'coin.wav', 'pop.wav', 'rise.wav', 'click.wav', 'thud.wav', 'ding.wav', 'shimmer.wav', 'cash.wav', 'ambient.wav'] as const;
export const sections = ['开场', '问题', '解释', '演示', '对比', '总结', '结尾'] as const;

const scene = z.object({
  section: z.enum(sections).describe('叙事段落'),
  kind: z.enum(sceneKinds),
  transition: z.enum(transitionTypes).describe('进入本场景的转场'),
  animation: z.enum(animationTypes).describe('本场景主动画'),
  start: z.number().min(0),
  end: z.number().min(0),
  index: z.string().describe('左上角编号，如 01'),
  label: z.string().describe('左上角小标题'),
  note: z.string().default('').describe('指标卡底部说明'),
  steps: z.array(metricStep).default([]),
  pills: z.array(z.string()).default([]).describe('顶部流程标签，可空'),
  assumption: z.string().default('').describe('右下角口径说明，可空'),
});

export const contentSchema = z.object({
  durationInSeconds: z.number().min(1),
  brand: z.string(),
  edition: z.string(),
  accentColor: zColor(),
  stallSign: z.string().describe('摊车招牌文字'),
  cover: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    sceneIndex: z.number().int().min(0).optional(),
    progress: z.number().min(0).max(0.99).optional(),
  }).optional().describe('封面文案与选景；未填写时沿用开场标题与第一个主体场景'),
  intro: z.object({eyebrow: z.string(), titleBefore: z.string(), titleHighlight: z.string(), titleAfter: z.string(), tagline: z.string()}),
  outro: z.object({eyebrow: z.string(), titleBefore: z.string(), titleHighlight: z.string(), titleAfter: z.string(), tagline: z.string()}),
  scenes: z.array(scene),
  subtitles: z.array(z.object({start: z.number(), end: z.number(), text: z.string()})),
  sfx: z.array(z.object({at: z.number(), file: z.enum(sfxFiles), volume: z.number().min(0).max(1).default(0.7)})),
  voiceover: z.object({file: z.string().default('').describe('public/ 下的旁白文件名，留空表示无旁白'), volume: z.number().min(0).max(1).default(1)}),
  transitionFrames: z.number().int().min(1).describe('转场时长（帧）'),
  autoSfx: z.boolean().describe('按转场/动画/指标自动放置音效'),
  ambient: z.boolean().describe('是否铺 60 秒氛围底'),
  mix: z.object({master: z.number().min(0).max(1), transition: z.number().min(0).max(1), impact: z.number().min(0).max(1), money: z.number().min(0).max(1), ui: z.number().min(0).max(1), ambient: z.number().min(0).max(1)}),
});

export type Content = z.infer<typeof contentSchema>;
export type Scene = Content['scenes'][number];
export type MetricStep = Scene['steps'][number];

const step = (s: Partial<MetricStep> & Pick<MetricStep, 'at' | 'caption' | 'value' | 'unit'>): MetricStep => ({prefix: '', secondaryPrefix: '', secondaryUnit: '', ...s});

export const defaultContent: Content = {
  durationInSeconds: 60,
  brand: '一口气看懂',
  edition: '三维微缩商业讲解 · 60秒',
  accentColor: '#cf302f',
  stallSign: '煎饼果子',
  intro: {eyebrow: '从一个煎饼摊开始', titleBefore: '普通人如何成为', titleHighlight: '上市公司', titleAfter: '的老板？', tagline: '摊位 → 连锁 → 融资 → 股份制 → 上市'},
  outro: {eyebrow: '一口气看懂', titleBefore: '从一个煎饼摊', titleHighlight: '到上市公司', titleAfter: '', tagline: '复制 · 品牌 · 资本 · 规范'},
  scenes: [
    {section: '开场', kind: 'intro', transition: 'cut', animation: 'cameraFly', start: 0, end: 5, index: '00', label: '开场', note: '', steps: [], pills: [], assumption: ''},
    {section: '问题', kind: 'stall', transition: 'zoom', animation: 'assemble', start: 5, end: 13, index: '01', label: '一个煎饼摊，能走多远？', note: '一个人、一台车，收入有天花板',
      steps: [step({at: 0.5, caption: '从一个摊位开始', value: 1, unit: '个摊位'}), step({at: 2.1, caption: '一个摊位 · 每日销量', value: 200, unit: '个 / 天'}), step({at: 3.8, caption: '一个摊位 · 每日利润', prefix: '¥', value: 1000, unit: '/ 天'})], pills: [], assumption: ''},
    {section: '解释', kind: 'expand', transition: 'whip', animation: 'expand', start: 13, end: 22, index: '02', label: '答案一：复制', note: '',
      steps: [step({at: 1.0, caption: '摊位数量', value: 2, unit: '个摊位', secondaryPrefix: '¥', secondaryValue: 2000, secondaryUnit: '/ 天'}), step({at: 3.6, caption: '摊位数量', value: 10, unit: '个摊位', secondaryPrefix: '¥', secondaryValue: 10000, secondaryUnit: '/ 天'}), step({at: 6.0, caption: '摊位数量', value: 100, unit: '个摊位', secondaryPrefix: '¥', secondaryValue: 100000, secondaryUnit: '/ 天'})], pills: [], assumption: ''},
    {section: '解释', kind: 'chain', transition: 'dissolve', animation: 'cameraFly', start: 22, end: 29, index: '03', label: '答案二：品牌化', note: '统一招牌 · 统一配方 · 统一供应链',
      steps: [step({at: 0.4, caption: '连锁门店', value: 100, unit: '家'}), step({at: 3.0, caption: '一天 10 万，一年就是', value: 3650, unit: '万 / 年'})], pills: [], assumption: '按每日10万、全年365天示意'},
    {section: '演示', kind: 'funding', transition: 'wipe', animation: 'coinBurst', start: 29, end: 36, index: '04', label: '演示：引入投资人', note: '用 10% 股份换 5000 万发展资金',
      steps: [step({at: 0.6, caption: '融资金额', prefix: '¥', value: 5000, unit: '万'}), step({at: 4.4, caption: '公司估值', prefix: '¥', value: 5, unit: '亿', secondaryPrefix: '出让 ', secondaryValue: 10, secondaryUnit: '% 股份'})], pills: [], assumption: '5000万 ÷ 10% = 5亿 估值'},
    {section: '演示', kind: 'shares', transition: 'orbit', animation: 'assemble', start: 36, end: 43, index: '05', label: '演示：改制为股份公司', note: '账目规范 · 业绩达标',
      steps: [step({at: 0.6, caption: '净资产折股', value: 1, unit: '亿股'})], pills: ['有限公司', '股份公司', '规范运营'], assumption: ''},
    {section: '对比', kind: 'compare', transition: 'whip', animation: 'chartGrow', start: 43, end: 49, index: '06', label: '对比：单店 vs 连锁', note: '同样的煎饼，不同的规模',
      steps: [step({at: 0.5, caption: '一个摊位 · 年利润', prefix: '¥', value: 36.5, unit: '万 / 年'}), step({at: 3.0, caption: '100 家连锁 · 年利润', prefix: '¥', value: 3650, unit: '万 / 年', secondaryPrefix: '相差 ', secondaryValue: 100, secondaryUnit: '倍'})], pills: [], assumption: '按每摊每日1000元、全年365天示意'},
    {section: '总结', kind: 'ipo', transition: 'zoom', animation: 'stairRise', start: 49, end: 55, index: '07', label: '总结：敲钟上市', note: '',
      steps: [step({at: 0.4, caption: '递交申请 · 审核 · 发行', value: 1, unit: '次公开发行'}), step({at: 2.8, caption: '按 50 倍市盈率，市值约', prefix: '¥', value: 18, unit: '亿'})], pills: [], assumption: '3650万 × 50倍 ≈ 18亿，仅作示意'},
    {section: '结尾', kind: 'outro', transition: 'dissolve', animation: 'coinBurst', start: 55, end: 60, index: '08', label: '从摊位到上市', note: '', steps: [], pills: ['摊位', '连锁', '融资', '股份制', '上市'], assumption: ''},
  ],
  subtitles: [
    {start: 0.2, end: 2.4, text: '今天我们来玩个大的，用一分钟讲清楚'},
    {start: 2.6, end: 4.8, text: '普通人如何一步步，成为上市公司的老板？'},
    {start: 5.2, end: 7.0, text: '假设你今天摆了个煎饼摊'},
    {start: 7.1, end: 8.7, text: '一天能卖 200 个煎饼，赚 1000 块'},
    {start: 8.9, end: 10.8, text: '可一个人、一台车，干到头也就这样'},
    {start: 11.0, end: 12.8, text: '问题来了：小生意怎么变成大公司？'},
    {start: 13.2, end: 15.8, text: '第一步是复制：开两个摊位，一天赚 2000'},
    {start: 16.0, end: 18.4, text: '开 10 个摊位，一天就是 1 万'},
    {start: 18.6, end: 21.8, text: '开到 100 个摊位，一天就是 10 万'},
    {start: 22.2, end: 25.0, text: '统一招牌、统一配方，摊位变成了连锁品牌'},
    {start: 25.2, end: 28.8, text: '一天 10 万，一年就是 3650 万'},
    {start: 29.2, end: 31.4, text: '想开得更快？投资人看中了你的增长'},
    {start: 31.6, end: 33.4, text: '拿出 5000 万，换你 10% 的股份'},
    {start: 33.6, end: 35.8, text: '这意味着，你的公司估值 5 个亿'},
    {start: 36.2, end: 38.6, text: '接下来，把公司改成股份有限公司'},
    {start: 38.8, end: 40.8, text: '净资产折成 1 亿股，每一股都有价值'},
    {start: 41.0, end: 42.8, text: '账目规范、业绩达标，才能敲开资本市场的大门'},
    {start: 43.2, end: 45.8, text: '对比一下：一个摊位，一年 36 万'},
    {start: 46.0, end: 48.8, text: '100 家连锁，一年 3650 万，整整差了 100 倍'},
    {start: 49.2, end: 51.6, text: '最后，递交申请、通过审核、公开发行'},
    {start: 51.8, end: 54.8, text: '按 50 倍市盈率，市值冲上 18 个亿'},
    {start: 55.2, end: 57.4, text: '摊位、连锁、融资、股份制、上市'},
    {start: 57.6, end: 59.8, text: '从一个煎饼摊，到一家上市公司'},
  ],
  // 手动追加音效（自动音效之外）。示例：{at: 12, file: 'ding.wav', volume: 0.8}
  sfx: [],
  voiceover: {file: '', volume: 1},
  transitionFrames: 14,
  autoSfx: true,
  ambient: true,
  mix: {master: 1, transition: 0.6, impact: 0.7, money: 0.8, ui: 0.5, ambient: 0.25},
};
