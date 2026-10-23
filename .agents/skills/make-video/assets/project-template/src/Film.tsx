import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Lighting, ViewCtx} from './Visuals';
import {World} from './Scenes';
import type {Content, MetricStep, Scene} from './content';
import {buildCues} from './sfx';
import './style.css';
import './layout.css';

const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const smooth = (x: number) => {const t = clamp(x); return t * t * (3 - 2 * t);};
const pop = (f: number, fps: number, d = 22) => spring({frame: Math.max(0, f), fps, durationInFrames: d, config: {damping: 17, stiffness: 130, mass: .7}});
const fmt = (v: number) => {const r = Math.abs(v) < 100 && !Number.isInteger(v) ? Math.round(v * 10) / 10 : Math.round(v); return r.toLocaleString('en-US');};

function Metric({scene, f, fps}: {scene: Scene; f: number; fps: number}) {
  const t = f / fps;
  const steps = scene.steps;
  const idx = steps.reduce((acc, s, i) => (t >= s.at ? i : acc), -1);
  if (idx < 0) return null;
  const cur: MetricStep = steps[idx];
  const prev = idx > 0 ? steps[idx - 1] : undefined;
  const sf = f - cur.at * fps;
  const k = smooth(sf / 16);
  const sameUnit = prev && prev.unit === cur.unit;
  const value = (sameUnit ? prev.value : 0) + (cur.value - (sameUnit ? prev.value : 0)) * k;
  const sec = cur.secondaryValue;
  return <div className="metric" style={{opacity: clamp((f - steps[0].at * fps) / 10), transform: `translateY(${(1 - pop(sf, fps)) * 12}px)`}}>
    <div className="metric-caption">{cur.caption}</div>
    <div className="metric-value">{cur.prefix && <small>{cur.prefix}</small>}{fmt(value)}<span>{cur.unit}</span></div>
    {sec !== undefined && <div className="expansion-profit">{cur.secondaryPrefix}{fmt((prev?.secondaryValue ?? 0) + (sec - (prev?.secondaryValue ?? 0)) * k)}<span> {cur.secondaryUnit}</span></div>}
    {scene.note && <><div className="metric-rule"/><div className="metric-note">{scene.note}</div></>}
  </div>;
}

/** 动画层 chartGrow：按指标步骤的数值画柱状图，逐根生长。 */
function Chart({scene, f, fps}: {scene: Scene; f: number; fps: number}) {
  const max = Math.max(...scene.steps.map((s) => s.value), 1);
  return <div className="chart">{scene.steps.map((st, i) => {
    const g = smooth((f - st.at * fps) / 24);
    return <div key={i} className="chart-col"><div className="chart-val" style={{opacity: g}}>{st.prefix}{fmt(st.value * g)}</div>
      <div className="chart-bar" style={{height: `${Math.max(1.5, (st.value / max) * 100) * g}%`}}/><div className="chart-label">{st.caption}</div></div>;
  })}</div>;
}

function Overlay({content}: {content: Content}) {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const scene = content.scenes.find((s) => t >= s.start && t < s.end);
  const sub = content.subtitles.find((s) => t >= s.start && t <= s.end);
  const local = scene ? frame - scene.start * fps : 0;
  const intro = scene?.kind === 'outro' ? content.outro : content.intro;
  return <AbsoluteFill className="overlay">
    <div className="topline"><span><b>{content.brand}</b></span><span className="edition">{content.edition}</span></div>
    {(scene?.kind === 'intro' || scene?.kind === 'outro') && <div className="intro-copy" style={{opacity: clamp(local / 16), transform: `translateY(${(1 - pop(local - 6, fps)) * 22}px)`}}>
      <div className="eyebrow">{intro.eyebrow}</div><h1>{intro.titleBefore}<br/><em>{intro.titleHighlight}</em>{intro.titleAfter}</h1><div className="intro-line"/><p>{intro.tagline}</p></div>}
    {scene && scene.kind !== 'intro' && scene.kind !== 'outro' && <div className="section-label" style={{opacity: clamp(local / 10)}}>{scene.index} <i className="section-tag">{scene.section}</i><span>{scene.label}</span></div>}
    {scene && scene.pills.length > 0 && <div className="growth-cycle">{scene.pills.map((p, i) => {const at = 8 + i * 12; return <React.Fragment key={p + i}>{i > 0 && <span className="cycle-arrow">→</span>}<span className={'cycle-word ' + (local >= at ? 'lit' : '')} style={{transform: `translateY(${(1 - pop(local - at, fps)) * 9}px)`}}>{p}</span></React.Fragment>;})}</div>}
    {scene && <Metric key={scene.index} scene={scene} f={local} fps={fps}/>}
    {scene?.animation === 'chartGrow' && <Chart scene={scene} f={local} fps={fps}/>}
    {scene?.assumption && <div className="assumption" style={{opacity: clamp((local - 60) / 15)}}>{scene.assumption}</div>}
    <div className="subtitle">{sub?.text ?? ''}</div>
    <div className="progress"><div style={{width: `${(frame / (durationInFrames - 1)) * 100}%`}}/></div>
  </AbsoluteFill>;
}

const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

/** 转场：根据当前场景的 transition（入场）与下一场景的 transition（出场）计算画面效果。 */
function useTransition(c: Content) {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const t = frame / fps;
  const i = Math.max(0, c.scenes.findIndex((s) => t >= s.start && t < s.end));
  const scene = c.scenes[i], next = c.scenes[i + 1];
  const T = c.transitionFrames;
  const lf = scene ? frame - scene.start * fps : 0;
  const toEnd = scene ? scene.end * fps - frame : 999;
  const inP = scene && i > 0 ? 1 - easeOut(lf / T) : 0; // 1 → 0
  const outP = next ? clamp(1 - toEnd / (T * .6)) : 0; // 0 → 1
  const outKind = next?.transition;
  const tr: React.CSSProperties = {};
  let veil = 0, wipe: number | null = null, zoomMul = 1, angleOffset = 0;
  const kind = scene?.transition;
  if (kind === 'whip' && inP > 0) {tr.transform = `translateX(${inP * inP * width * .45}px)`; tr.filter = `blur(${inP * 28}px)`;}
  if (outKind === 'whip' && outP > 0) {tr.transform = `translateX(${-outP * outP * width * .45}px)`; tr.filter = `blur(${outP * 28}px)`;}
  if (kind === 'zoom' && inP > 0) {tr.transform = `scale(${1 + inP * .9})`; tr.filter = `blur(${inP * 14}px)`;}
  if (outKind === 'zoom' && outP > 0) {tr.transform = `scale(${1 + outP * 1.4})`; tr.filter = `blur(${outP * 14}px)`; veil = outP * .5;}
  if (kind === 'dissolve') veil = Math.max(veil, inP);
  if (outKind === 'dissolve') veil = Math.max(veil, outP);
  if (kind === 'wipe' && inP > 0) wipe = 1 - inP;            // 色块向右滑出，露出新场景
  if (outKind === 'wipe' && outP > 0) wipe = outP - 1;       // 色块从左侧盖住旧场景
  if (kind === 'orbit' && inP > 0) {angleOffset = -inP * 1.1; zoomMul = 1 - inP * .25;}
  if (scene?.animation === 'cameraFly') {const k = easeOut(lf / (fps * 2.2)); zoomMul *= .5 + .5 * k; angleOffset += (1 - k) * .7;}
  return {tr, veil, wipe, zoomMul, angleOffset};
}

export const Film: React.FC<Content> = (content) => {
  const {width, height, fps, durationInFrames} = useVideoConfig();
  const vertical = height > width;
  // 叠层以 1280×720（横）/ 720×1280（竖）为设计基准，整体缩放到输出分辨率。
  const base = vertical ? {w: 720, h: 1280} : {w: 1280, h: 720};
  const s = width / base.w;
  // 三维相机 zoom 以参考样片 1280×720 为基准，按可视范围换算。
  const zoomScale = Math.min(width / 1280, height / 720) * (vertical ? 1.15 : 1);
  const {tr, veil, wipe, zoomMul, angleOffset} = useTransition(content);
  const cues = React.useMemo(() => buildCues(content, fps, durationInFrames), [content, fps, durationInFrames]);
  return <AbsoluteFill className={'film ' + (vertical ? 'vertical' : 'horizontal')} style={{['--accent' as string]: content.accentColor}}>
    <AbsoluteFill style={tr}>
      <ViewCtx.Provider value={{zoomScale, sign: content.stallSign, zoomMul, angleOffset}}>
        <ThreeCanvas shadows orthographic dpr={1} camera={{position: [12, 13.1, 15], zoom: 80, near: .1, far: 1000}} width={width} height={height} gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}>
          <Lighting/><World scenes={content.scenes}/>
        </ThreeCanvas>
      </ViewCtx.Provider>
    </AbsoluteFill>
    {veil > 0 && <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, #f4f2ea, #c9d2d8)', opacity: veil}}/>}
    {wipe !== null && <AbsoluteFill style={{background: content.accentColor, transform: `translateX(${wipe * 105}%) skewX(-12deg)`, boxShadow: '0 0 60px #0004'}}/>}
    <div className="grain"/><div className="vignette"/>
    <div style={{position: 'absolute', left: 0, top: 0, width: base.w, height: base.h, transform: `scale(${s})`, transformOrigin: '0 0'}}><Overlay content={content}/></div>
    {content.ambient && <Html5Audio src={staticFile('ambient.wav')} volume={content.mix.ambient * content.mix.master}/>}
    {content.voiceover.file && <Html5Audio src={staticFile(content.voiceover.file)} volume={content.voiceover.volume}/>}
    {cues.map((q, i) => <Sequence key={i} from={q.frame} layout="none" name={`sfx ${q.category} ${q.file}`}><Html5Audio src={staticFile(q.file)} volume={q.volume}/></Sequence>)}
  </AbsoluteFill>;
};
