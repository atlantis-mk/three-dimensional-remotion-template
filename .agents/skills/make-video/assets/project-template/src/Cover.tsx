import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {Lighting, ViewCtx} from './Visuals';
import {World} from './Scenes';
import type {Content} from './content';
import {FPS} from './config';

/** 独立排版：横版左右分区，4:3 与 3:4 上下分区；主体使用已落位的三维场景。 */
export const Cover: React.FC<Content> = (content) => {
  const {width, height} = useVideoConfig();
  const wide = width / height > 1.5;
  const unit = Math.min(width, height) / 1080;
  const margin = 70 * unit;
  const index = content.cover?.sceneIndex ?? Math.min(1, content.scenes.length - 1);
  const scene = content.scenes[index];
  const progress = content.cover?.progress ?? 0.9;
  // Still 固定 fps=1；三维动画的选景必须使用视频的真实帧率。
  const frame = scene ? Math.floor((scene.start + (scene.end - scene.start) * progress) * FPS) : 0;
  const title = content.cover?.title ?? `${content.intro.titleBefore}${content.intro.titleHighlight}${content.intro.titleAfter}`;
  const subtitle = content.cover?.subtitle ?? content.intro.tagline;
  const titleWidth = wide ? width * 0.40 : width - margin * 2;
  const titleHeight = height * (wide ? 0.55 : 0.27);
  // 以中文全角字宽保守估算，在行数和可用高度之间同时约束字号。
  const chars = Array.from(title);
  const count = Math.max(1, chars.length);
  const lineCount = Math.min(3, Math.ceil(count / (wide ? 7 : 9)));
  const perLine = Math.ceil(count / lineCount);
  const lines = title.includes('\n') ? title.split('\n') : Array.from({length: lineCount}, (_, i) => chars.slice(i * perLine, (i + 1) * perLine).join(''));
  const longest = Math.max(1, ...lines.map((line) => Array.from(line).length));
  const fontSize = Math.min(105 * unit, titleWidth / (longest * 1.05), titleHeight / (lines.length * 1.2));
  const pane = wide
    ? {left: width * 0.45, top: height * 0.10, width: width * 0.55, height: height * 0.82}
    : {left: margin * 0.35, top: height * 0.43, width: width - margin * 0.7, height: height * 0.54};
  return <AbsoluteFill style={{background: '#b9c5ce', color: '#28373e', fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif'}}>
    <div style={{position: 'absolute', ...pane, overflow: 'hidden', borderRadius: 25 * unit}}>
        <ViewCtx.Provider value={{zoomScale: Math.min(pane.width / 1280, pane.height / 720) * 0.92, sign: content.stallSign, zoomMul: 1, angleOffset: 0}}>
          <ThreeCanvas shadows orthographic dpr={1} camera={{position: [12, 13.1, 15], zoom: 80, near: 0.1, far: 1000}} width={Math.round(pane.width)} height={Math.round(pane.height)} gl={{antialias: true, alpha: false}}>
            <Lighting/><World scenes={content.scenes} stillFrame={frame} stillFps={FPS}/>
          </ThreeCanvas>
        </ViewCtx.Provider>
    </div>
    <div style={{position: 'absolute', left: margin, top: margin, fontSize: 23 * unit, fontWeight: 700, letterSpacing: 2 * unit}}>{content.brand}</div>
    <div style={{position: 'absolute', left: margin, top: height * (wide ? 0.23 : 0.14), width: titleWidth}}>
      <div style={{height: 7 * unit, width: 75 * unit, background: content.accentColor, marginBottom: 25 * unit}}/>
      <div style={{fontSize, fontWeight: 900, lineHeight: 1.2}}>{lines.map((line, i) => <div key={i}>{line}</div>)}</div>
      <div style={{fontSize: 25 * unit, lineHeight: 1.7, marginTop: 27 * unit, color: '#52636c', overflowWrap: 'anywhere'}}>{subtitle}</div>
    </div>
    <div style={{position: 'absolute', bottom: margin * 0.55, left: margin, width: width - margin * 2, height: 3 * unit, background: content.accentColor}}/>
  </AbsoluteFill>;
};
