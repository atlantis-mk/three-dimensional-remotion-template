import type {Content, Scene} from './content';

/** 音效分类：每类单独音量，再乘 master。 */
export type SfxCategory = 'transition' | 'impact' | 'money' | 'ui' | 'ambient';
export const sfxCategory: Record<string, SfxCategory> = {
  'whoosh.wav': 'transition', 'shimmer.wav': 'transition', 'rise.wav': 'transition',
  'pop.wav': 'impact', 'thud.wav': 'impact',
  'coin.wav': 'money', 'cash.wav': 'money',
  'click.wav': 'ui', 'ding.wav': 'ui',
  'ambient.wav': 'ambient',
};
type Cue = {at: number; file: string; volume: number};

/** 中央音效表：at 为相对场景开始的秒数。 */
export const transitionCues: Record<Scene['transition'], Cue[]> = {
  cut: [{at: 0, file: 'click.wav', volume: 0.6}],
  dissolve: [{at: -0.2, file: 'shimmer.wav', volume: 0.7}],
  whip: [{at: -0.25, file: 'whoosh.wav', volume: 1}],
  zoom: [{at: -0.25, file: 'whoosh.wav', volume: 0.8}, {at: 0.05, file: 'thud.wav', volume: 0.5}],
  wipe: [{at: -0.25, file: 'whoosh.wav', volume: 0.7}, {at: 0.2, file: 'click.wav', volume: 0.7}],
  orbit: [{at: 0, file: 'rise.wav', volume: 0.6}, {at: 0.1, file: 'whoosh.wav', volume: 0.5}],
};
export const animationCues: Record<Scene['animation'], Cue[]> = {
  assemble: [{at: 0.4, file: 'pop.wav', volume: 0.8}, {at: 0.9, file: 'thud.wav', volume: 0.6}, {at: 1.5, file: 'pop.wav', volume: 0.6}],
  expand: [{at: 1.0, file: 'pop.wav', volume: 0.8}, {at: 3.6, file: 'rise.wav', volume: 0.7}, {at: 6.0, file: 'rise.wav', volume: 0.9}],
  coinBurst: [{at: 0.5, file: 'coin.wav', volume: 1}, {at: 1.0, file: 'coin.wav', volume: 0.7}, {at: 1.6, file: 'cash.wav', volume: 0.9}],
  stairRise: [{at: 0.1, file: 'rise.wav', volume: 0.9}, {at: 2.6, file: 'ding.wav', volume: 0.9}],
  chartGrow: [{at: 0.6, file: 'rise.wav', volume: 0.6}, {at: 3.4, file: 'ding.wav', volume: 0.8}],
  cameraFly: [{at: 0, file: 'whoosh.wav', volume: 0.6}, {at: 1.6, file: 'shimmer.wav', volume: 0.5}],
};
/** 指标卡每次切换数字时的提示音。 */
export const metricStepCue: Cue = {at: 0, file: 'click.wav', volume: 0.5};

export type PlacedCue = {frame: number; file: string; volume: number; category: SfxCategory};

export function buildCues(c: Content, fps: number, totalFrames: number): PlacedCue[] {
  const raw: Cue[] = [];
  if (c.autoSfx) {
    c.scenes.forEach((s, i) => {
      if (i > 0 || s.transition !== 'cut') transitionCues[s.transition].forEach((q) => raw.push({...q, at: s.start + q.at}));
      animationCues[s.animation].forEach((q) => raw.push({...q, at: s.start + q.at}));
      s.steps.forEach((st) => raw.push({...metricStepCue, at: s.start + st.at}));
    });
  }
  c.sfx.forEach((q) => raw.push(q));
  return raw
    .map((q) => ({frame: Math.max(0, Math.round(q.at * fps)), file: q.file, category: sfxCategory[q.file] ?? 'ui', volume: q.volume}))
    .filter((q) => q.frame < totalFrames)
    .map((q) => ({...q, volume: Math.min(1, q.volume * c.mix[q.category] * c.mix.master)}));
}
