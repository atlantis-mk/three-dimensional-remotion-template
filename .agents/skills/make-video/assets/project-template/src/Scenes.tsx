import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Box, Coin, Camera, Cart, Coins, Flag, GOLD, Person, Piece, Population, R, Stage, Staircase, StreetLamp, Tree, WHITE, ease, mix, settle} from './Visuals';
import type {Scene} from './content';

/**
 * 把场景本地时间映射到参考样片的帧号区间，让参考里的组装/扩张动画按场景时长等比伸缩。
 * 参考区间：intro 0–171，stall 171–340，expand 340–559，ipo 559–735（30fps）。
 */
const refRange: Record<string, [number, number]> = {intro: [0, 171], stall: [171, 340], expand: [340, 559], ipo: [559, 735]};
const toRef = (kind: string, local: number, len: number) => {const [a, b] = refRange[kind]; return a + (local / len) * (b - a);};

function Intro({f}: {f: number}) {
  return <><Camera zoom={mix(78, 83, ease(f / 170))} target={[-1.6, .9, 0]}/><group position={[2.2, 0, .2]} rotation={[0, mix(-.3, .15, ease(f / 170)), 0]}><Stage w={5.8} d={5.8}/><Staircase f={f} z={1.5}/><Person x={-1.7} z={1.3} c={R} f={f}/></group></>;
}
function Stall({f}: {f: number}) {
  const move = ease((f - 201) / 111);
  return <><Camera zoom={mix(99, 119, move)} target={[.2, .83, -.15]}/><group rotation={[0, mix(-.22, .18, ease((f - 171) / 169)), 0]}><Stage w={8.2} d={5.25} road/><Cart x={.55} z={-.6} f={f} born={178}/><Tree x={-2.7} z={-1.65}/><StreetLamp x={2.65} z={-1.15}/><Person x={-.63 + mix(-.35, 0, ease((f - 206) / 35))} z={.72} f={f} walk={1 - ease((f - 206) / 35)}/><Person x={2} z={.65} c='#d3a13b' f={f}/><Coins f={f} start={300} x={.3} z={.95}/></group></>;
}
function Expand({f}: {f: number}) {
  const a = ease((f - 340) / 35), b = ease((f - 427) / 37), c = ease((f - 487) / 42);
  const zoom = mix(mix(mix(119, 83, a), 48, b), 20.8, c);
  return <><Camera zoom={zoom} target={[mix(.2, 0, a), .65, 0]}/><group rotation={[0, mix(.18, .31, ease((f - 340) / 219)), 0]}><Stage w={mix(mix(9.4, 15.8, b), 29, c)} d={mix(mix(5.25, 7.7, b), 25, c)} road={f < 430}/>{f < 427 ? <><Cart x={.55} z={-.6} f={f}/><Cart x={3.25} z={-.6} f={f} born={365}/><Person x={-.63} z={.72} f={f}/><Person x={2.1} z={.8} c='#d3a13b' f={f}/><StreetLamp x={-3.5} z={-1.1}/><Coins f={f} start={300} x={.3} z={.95}/></> : <Population f={f}/>}</group></>;
}
/** 连锁：100 个摊位整齐排开，镜头缓慢推近，前排金币按序落下。 */
function Chain({f, len}: {f: number; len: number}) {
  const t = ease(f / len);
  return <><Camera zoom={mix(20.8, 27, t)} target={[0, .65, 1.5]}/><group rotation={[0, mix(.31, .12, t), 0]}><Stage w={29} d={25}/><Population f={600}/>
    {[-6, -2, 2, 6].map((x, i) => <Coins key={x} f={f} start={70 + i * 10} x={x} z={12.2} n={9}/>)}</group></>;
}
/** 融资：三台摊车 + 投资人走入，金币柱依次堆高。 */
function Funding({f, len}: {f: number; len: number}) {
  const t = ease(f / len), walk = ease(f / 50);
  return <><Camera zoom={mix(66, 60, t)} target={[.3, .9, 0]}/><group rotation={[0, mix(-.18, .16, t), 0]}><Stage w={12.6} d={6.3} road/>
    <Cart x={-3.3} z={-.65} f={f}/><Cart x={0} z={-.65} f={f}/><Cart x={3.3} z={-.65} f={f}/>
    <Coins f={f} start={20} x={-3.3} z={1.05} n={6}/><Coins f={f} start={60} x={0} z={1.05} n={8}/><Coins f={f} start={100} x={3.3} z={1.05} n={10}/>
    <Coins f={f} start={150} x={5.2} z={.3} n={14}/>
    <Person x={mix(7.4, 4.9, walk)} z={1.1} c={GOLD} f={f} walk={1 - walk}/><Person x={mix(8.0, 5.6, walk)} z={1.5} c='#4c5755' f={f} walk={1 - walk}/>
    <Person x={-4.45} z={.5} c={R} f={f}/><StreetLamp x={-5.6} z={-1.5}/></group></>;
}
/** 股份制：公司大楼逐层落下组装，旁边是按持股比例堆起的股份方块。 */
function Shares({f, len}: {f: number; len: number}) {
  const t = ease(f / len);
  const floors = 6;
  const holders = [{c: R, n: 6}, {c: GOLD, n: 2}, {c: '#355c77', n: 1}, {c: '#9aa7a6', n: 1}];
  return <><Camera zoom={mix(52, 58, t)} target={[0, 2.3, 0]}/><group rotation={[0, mix(-.25, .12, t), 0]}><Stage w={11} d={7}/>
    <group position={[-1.6, 0, -.4]}>
      {Array.from({length: floors}, (_, i) => <Piece key={i} f={f} born={8 + i * 9} height={4}>
        <Box p={[0, .3 + i * .6, 0]} s={[2.6, .56, 2.2]} c={i % 2 ? WHITE : '#d6d8d0'} r={.05}/>
        <Box p={[0, .32 + i * .6, 1.105]} s={[2.2, .26, .02]} c='#3c4a52' r={.01}/>
      </Piece>)}
      <Piece f={f} born={8 + floors * 9} height={3}><Box p={[0, floors * .6 + .08, 0]} s={[2.8, .16, 2.4]} c={R} r={.04}/>
        <group position={[.9, floors * .6 + .16, .6]} scale={settle(f - (20 + floors * 9), 18)}><Flag f={f}/></group></Piece>
    </group>
    <group position={[2.2, 0, .6]}>
      {holders.map((h, k) => Array.from({length: h.n}, (_, j) => <Piece key={k + '-' + j} f={f} born={90 + k * 14 + j * 5} height={3}>
        <Box p={[k * .72 - 1.0, .16 + j * .32, 0]} s={[.6, .3, .6]} c={h.c} kind={h.c === GOLD ? 'gold' : 'paint'} r={.04}/></Piece>))}
    </group>
    {[[-3.6, 1.6, R], [-2.9, 2.2, GOLD], [.2, 2.4, '#355c77'], [1.0, 2.6, '#4c5755']].map(([x, z, c], i) => <Person key={i} x={x} z={z} c={c} f={f + i * 20}/>)}
    <Tree x={-4.6} z={-2.2}/></group></>;
}
function Ipo({f}: {f: number}) {
  const push = ease((f - 559) / 80);
  return <><Camera zoom={mix(34, 43, push)} target={[1.3, 1.0, 0]}/><group rotation={[0, mix(.1, -.09, ease((f - 559) / 175)), 0]}><Stage w={17.5} d={14}/><Staircase f={f} x={-4.2} z={3.3} gold scale={1.55}/><Population f={f} scale={.35} final/><Coins f={f} start={585} x={-2.6} z={3.7} n={8}/><Person x={-4.5} z={4.4} c={R} f={f}/></group></>;
}

/** 对比：左侧单个摊位，右侧 100 家连锁缩影。 */
function Compare({f, len}: {f: number; len: number}) {
  const t = ease(f / len), b = ease((f - 40) / 30);
  return <><Camera zoom={mix(44, 40, t)} target={[0, .8, 0]}/><group rotation={[0, mix(-.08, .08, t), 0]}><Stage w={20} d={10}/>
    <Cart x={-6} z={0} f={f} born={-999}/><Person x={-6.6} z={1.5} c={R} f={f}/><Coins f={f} start={12} x={-4.4} z={1.6} n={3}/>
    <Box p={[-1.6, .06, 0]} s={[.06, .04, 8.6]} c='#9aa7a6' r={0}/>
    <group position={[4.2, 0, 0]} scale={.0001 + b}><Population f={600} scale={.28}/></group>
    <Coins f={f} start={95} x={4.2} z={4.3} n={12}/></group></>;
}
/** 结尾：金色台阶 + 旗帜定格，镜头缓慢拉远。 */
function Outro({f, len}: {f: number; len: number}) {
  const t = ease(f / len);
  return <><Camera zoom={mix(36, 31, t)} target={[-3.2, 1.0, 0]}/><group rotation={[0, mix(-.09, -.2, t), 0]}><Stage w={17.5} d={14}/><Staircase f={700} x={-4.2} z={3.3} gold scale={1.55}/><Population f={700} scale={.35} final/><Coins f={700} start={585} x={-2.6} z={3.7} n={8}/><Person x={-4.5} z={4.4} c={R} f={f}/></group></>;
}

/** 动画层 coinBurst：金币从地面喷出、抛物线飞散、落地弹跳。 */
function CoinBurst({f, scale = 1, p = [0, 0, 1.6]}: {f: number; scale?: number; p?: number[]}) {
  return <group position={p as [number, number, number]} scale={scale}>{Array.from({length: 22}, (_, i) => {
    const t0 = 12 + i * 1.6, age = f - t0; if (age < 0) return null;
    const ang = i * 2.399, sp = .045 + (i % 5) * .012, vy = .2 + (i % 4) * .03, g = .0105;
    const T = (2 * vy) / g, a = Math.min(age, T);
    const y = Math.max(0, vy * a - .5 * g * a * a) + (age > T ? Math.abs(Math.sin((age - T) * .5)) * Math.exp(-(age - T) / 6) * .25 : 0);
    const r = sp * a;
    return <group key={i} position={[Math.cos(ang) * r, y + i * .004, Math.sin(ang) * r]} rotation={[age < T ? age * .35 : Math.PI / 2 * 0, i, age < T ? age * .2 : 0]}><Coin r={.26}/></group>;
  })}</group>;
}

export function World({scenes, stillFrame, stillFps}: {scenes: Scene[]; stillFrame?: number; stillFps?: number}) {
  const currentFrame = useCurrentFrame();
  const frame = stillFrame ?? currentFrame;
  const config = useVideoConfig();
  const fps = stillFps ?? config.fps;
  const t = frame / fps;
  const scene = scenes.find((s) => t >= s.start && t < s.end) ?? scenes[scenes.length - 1];
  if (!scene) return null;
  const len = (scene.end - scene.start) * fps;
  const local = Math.max(0, frame - scene.start * fps);
  const main = renderKind(scene, local, len);
  return <>{main}
    {scene.animation === 'coinBurst' && <CoinBurst f={local} scale={scene.kind === 'outro' || scene.kind === 'ipo' ? 1.8 : 1} p={scene.kind === 'outro' ? [-1, 0, 5] : [0, 0, 1.6]}/>}
    {scene.animation === 'stairRise' && scene.kind !== 'ipo' && <Staircase f={558 + local * 1.2} x={4.2} z={1.5} gold/>}
  </>;
}

function renderKind(scene: Scene, local: number, len: number) {
  switch (scene.kind) {
    case 'intro': return <Intro f={toRef('intro', local, len)}/>;
    case 'stall': return <Stall f={toRef('stall', local, len)}/>;
    case 'expand': return <Expand f={toRef('expand', local, len)}/>;
    case 'chain': return <Chain f={local} len={len}/>;
    case 'funding': return <Funding f={local} len={len}/>;
    case 'shares': return <Shares f={local} len={len}/>;
    case 'compare': return <Compare f={local} len={len}/>;
    case 'ipo': return <Ipo f={toRef('ipo', local, len)}/>;
    case 'outro': return <Outro f={local} len={len}/>;
  }
}
