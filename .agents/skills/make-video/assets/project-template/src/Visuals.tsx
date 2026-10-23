// 三维微缩模型库：改编自参考模板「三维微缩商业讲解」的 Visuals.tsx（模型、材质、灯光、镜头、组装与扩张动画）。
// 内部动画沿用参考样片的帧号节奏；Scenes.tsx 会把每个场景的本地时间映射到这些节奏上。
import React, {createContext, useContext, useLayoutEffect, useMemo, useRef} from 'react';
// 画面缩放（正交相机 zoom 乘数，按输出分辨率换算）与摊车招牌文字，由 Film 通过 Context 注入。
export const ViewCtx=createContext({zoomScale:1,sign:'煎饼果子',zoomMul:1,angleOffset:0});
import {useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

export const R='#cb261c', WHITE='#f3f0e3', INK='#30373c', GOLD='#c99732';
export const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const sat=(x:number)=>Math.max(0,Math.min(1,x));
export const ease=(x:number)=>{const t=sat(x);return t*t*(3-2*t);};
// A critically damped landing: zero motion after its exact settling frame.
export function settle(f:number,d=24){if(f<=0)return 0;if(f>=d)return 1;const x=f/d;return 1-Math.pow(1-x,3)*(1+3*x);}
function drop(f:number,d=24){const t=sat(f/d);return t>=1?0:(1-t)*(1-t)*2.4-Math.sin(t*Math.PI*2)*.085*(1-t);}
const geometryCache=new Map<string,T.BufferGeometry>();
function rounded(s:number[],r=.04){const radius=Math.min(r,Math.min(...s)*.28);const key=s.join(',')+':'+radius;if(!geometryCache.has(key))geometryCache.set(key,new RoundedBoxGeometry(s[0],s[1],s[2],2,radius));return geometryCache.get(key)!;}
const mats=new Map<string,T.MeshStandardMaterial>();
let seed=17;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
function surface(kind:string){const key='surface:'+kind;if(mats.has(key))return mats.get(key)!;const ca=document.createElement('canvas');ca.width=ca.height=256;const cx=ca.getContext('2d')!;seed=kind==='wood'?73:89;const pixels=cx.createImageData(256,256);for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4;const noise=(random()-.5)*18;const grain=kind==='wood'?Math.sin(y*.32+Math.sin(x*.017)*.9)*4+Math.sin(y*1.9)*2:0;const rgb=kind==='wood'?[199,158,96]:kind==='stone'?[226,224,210]:[180,192,200];for(let c=0;c<3;c++)pixels.data[i+c]=rgb[c]+noise+grain;pixels.data[i+3]=255;}cx.putImageData(pixels,0,0);if(kind==='wood'){for(let i=0;i<40;i++){cx.strokeStyle=`rgba(99,63,28,${.015+random()*.025})`;cx.lineWidth=.5;cx.beginPath();const y=random()*256;cx.moveTo(0,y);cx.bezierCurveTo(80,y-2,180,y+4,256,y);cx.stroke();}}
 const texture=new T.CanvasTexture(ca);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(kind==='wood'?1:4,kind==='wood'?1:4);texture.anisotropy=4;
 const material=new T.MeshStandardMaterial({map:texture,roughness:kind==='wood'?.62:.92,bumpMap:texture,bumpScale:kind==='wood'?.008:.005});mats.set(key,material);return material;}
function material(c:string,kind='paint'){const key=c+kind;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:c,roughness:kind==='metal'?.36:kind==='gold'?.53:kind==='rubber'?.88:.67,metalness:kind==='metal'?.62:kind==='gold'?.25:0}));return mats.get(key)!;}
export function Box({p=[0,0,0],s=[1,1,1],c=WHITE,r=.04,rot=[0,0,0],kind='paint',cast=true}:any){return <mesh position={p} rotation={rot} geometry={rounded(s,r)} material={kind==='wood'||kind==='stone'?surface(kind):material(c,kind)} castShadow={cast} receiveShadow/>;}
export function Cyl({p=[0,0,0],r=.2,r2,h=.1,c=WHITE,rot=[0,0,0],kind='paint',seg=32}:any){return <mesh position={p} rotation={rot} castShadow receiveShadow material={material(c,kind)}><cylinderGeometry args={[r,r2??r,h,seg]}/></mesh>;}
function Sphere({p=[0,0,0],r=.2,c='#dab990',scale=[1,1,1]}:any){return <mesh position={p} scale={scale} castShadow receiveShadow material={material(c)}><sphereGeometry args={[r,24,16]}/></mesh>;}
function Ring({p=[0,0,0],r=.3,t=.025,c=GOLD,rot=[Math.PI/2,0,0],kind='metal'}:any){return <mesh position={p} rotation={rot} material={material(c,kind)} castShadow><torusGeometry args={[r,t,8,40]}/></mesh>;}
let shadowTex:T.CanvasTexture;
export function AO({x=0,z=0,w=1,d=1,a=.35,y=.034}:any){if(!shadowTex){const ca=document.createElement('canvas');ca.width=ca.height=128;const cx=ca.getContext('2d')!;const grad=cx.createRadialGradient(64,64,8,64,64,64);grad.addColorStop(0,'rgba(38,44,47,.8)');grad.addColorStop(.4,'rgba(38,44,47,.35)');grad.addColorStop(1,'rgba(38,44,47,0)');cx.fillStyle=grad;cx.fillRect(0,0,128,128);shadowTex=new T.CanvasTexture(ca);}return <mesh position={[x,y,z]} rotation={[-Math.PI/2,0,0]} renderOrder={2}><planeGeometry args={[w,d]}/><meshBasicMaterial map={shadowTex} transparent opacity={a} depthWrite={false}/></mesh>;}

export function Person({x=0,z=0,c='#355c77',scale=1,f=0,walk=0,chef=false}:any){const sway=Math.sin(f*.09)*.012;return <group position={[x,0,z]} scale={scale}>
 <AO w={.85} d={.7} a={.45}/><group rotation={[0,Math.sin(f*.04)*.025,sway*walk]} position={[0,Math.abs(Math.sin(f*.19))*.025*walk,0]}>
 <mesh position={[0,0,0]} material={material(c)} castShadow receiveShadow><latheGeometry args={[[[0,.03],[.16,.03],[.19,.075],[.18,.18],[.145,.38],[.1,.6],[0,.61]].map(([x,y])=>new T.Vector2(x,y)),32]} /></mesh>
 <Cyl p={[0,.66,0]} r={.061} h={.1} c='#d6b58e'/><Sphere p={[0,.81,0]} r={.181} scale={[.96,1.06,.95]}/>
 {chef&&<><Cyl p={[0,1.0,0]} r={.17} h={.14} c='#e5e7df'/><Sphere p={[0,1.055,0]} r={.17} c='#f6f3e8' scale={[1,.45,1]}/></>}
 </group></group>;}
function Bottle({x,z,c=R}:any){return <group position={[x,0,z]}><Cyl p={[0,1.13,0]} r={.042} r2={.052} h={.18} c={c}/><Cyl p={[0,1.245,0]} r={.017} h={.05} c='#e6dbc0'/><Sphere p={[0,1.21,0]} r={.043} c={c} scale={[1,.5,1]}/></group>;}
function Lettering(){const {sign}=useContext(ViewCtx);const tex=useMemo(()=>{const ca=document.createElement('canvas');ca.width=768;ca.height=192;const cx=ca.getContext('2d')!;cx.fillStyle='#eee9d9';cx.fillRect(0,0,768,192);cx.strokeStyle='#b94032';cx.lineWidth=5;cx.strokeRect(10,10,748,172);cx.fillStyle='#bc3b2d';cx.font='bold 112px PingFang SC, sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(sign,384,103);const tex=new T.CanvasTexture(ca);tex.colorSpace=T.SRGBColorSpace;return tex;},[sign]);return <mesh position={[-.17,1.59,.648]}><planeGeometry args={[1.35,.34]}/><meshStandardMaterial map={tex} roughness={.88}/></mesh>;}

function Awning(){return <group position={[0,2.04,-.04]} rotation={[-.035,0,0]}>{Array.from({length:7},(_,i)=>{const c=i%2===0?R:'#f1efdf';return <group key={i}><Box p={[-.96+i*.32,.02,-.06]} s={[.319,.075,1.42]} c={c} r={.015}/><Cyl p={[-.96+i*.32,-.06,.66]} r={.113} h={.319} rot={[0,0,Math.PI/2]} c={c}/></group>;})}</group>;}
export function Piece({f,born,children,height=2.6}:any){const age=f-born;if(age< -14)return null;const t=sat(age/15);const y=age<0?height:age<15?height*(1-t*t):Math.sin((age-15)*.8)*Math.exp(-(age-15)/3)*.025;return <group position={[0,Math.max(-.012,y),0]} rotation={[0,(1-t)*.06,0]}>{children}</group>;}
export function Cart({x=0,z=0,f=0,born=-999,scale=1,detail=true}:any){const a=settle(f-born,22);return <group position={[x,0,z]} scale={scale} visible={f>=born-14}>
 <AO w={3.1} d={2.15} a={.55*a}/>
 <Piece f={f} born={born}><Box p={[0,.55,0]} s={[1.94,.78,1.12]} c='#d6d8d0' r={.065}/></Piece><Piece f={f} born={born+18}><Box p={[0,.93,0]} s={[2.14,.14,1.3]} kind="wood" r={.045}/></Piece>
 <Piece f={f} born={born}><Box p={[-.17,.54,.574]} s={[1.48,.46,.032]} c='#adb6b6' r={.02}/><Box p={[-.17,.56,.599]} s={[1.39,.34,.016]} c='#c3c9c6' r={.012}/><Box p={[.986,.52,0]} s={[.018,.46,.68]} c='#bfc6c2' r={.012}/></Piece>
 <Piece f={f} born={born+10}>{[-.62,.62].map(xx=><group key={xx} position={[xx,.22,0]}><Cyl r={.245} h={1.27} c='#272d30' rot={[Math.PI/2,0,0]} seg={32}/>{[-.665,.665].map(zz=><Cyl key={zz} p={[0,0,zz]} r={.11} h={.023} c='#a3afb1' kind="metal" rot={[Math.PI/2,0,0]}/>)}</group>)}</Piece>
 <Piece f={f} born={born+24}>{[-.9,.9].map(xx=><React.Fragment key={xx}><Cyl p={[xx,1.48,-.53]} r={.027} h={1.15} c='#667274' kind="metal" seg={12}/><Cyl p={[xx,1.48,.53]} r={.027} h={1.15} c='#667274' kind="metal" seg={12}/><Cyl p={[xx,1.0,.53]} r={.046} h={.035} c='#929d9a' kind="metal"/></React.Fragment>)}</Piece>
 <Piece f={f} born={born+29}><Awning/></Piece>
 {detail&&<Piece f={f} born={born+33} height={1.3}><Lettering/>
 <Cyl p={[.35,1.027,.06]} r={.407} h={.055} c='#303638' kind="metal"/><Cyl p={[.35,1.06,.06]} r={.338} h={.018} c='#e3c877'/>
 <Ring p={[.35,1.075,.06]} r={.32} t={.005} c='#b6a05f' kind="paint"/>
 {Array.from({length:22},(_,i)=><Cyl key={i} p={[.35+Math.sin(i*2.4)*.29*Math.sqrt((i+1)/23),1.073,.06+Math.cos(i*2.4)*.29*Math.sqrt((i+1)/23)]} r={.006+(i%3)*.002} h={.002} c='#c7ab68' seg={6}/>)}
 <Box p={[-.58,1.022,.31]} s={[.47,.035,.27]} c='#d5d8cd' r={.02}/>{Array.from({length:6},(_,i)=><Sphere key={i} p={[-.72+(i%3)*.135,1.087,.235+Math.floor(i/3)*.12]} r={.052} c='#f1efe3' scale={[.82,1.15,.85]}/>)}
 <Cyl p={[-.55,1.055,-.27]} r={.14} h={.1} c='#d8ddd5'/><Cyl p={[-.55,1.109,-.27]} r={.119} h={.012} c='#eee6c5'/>
 <Bottle x={.91} z={.31}/><Bottle x={.91} z={.12} c='#353a37'/><Box p={[.69,1.022,-.36]} s={[.35,.018,.045]} c='#3f4846' rot={[0,.4,0]} r={.008}/>
 <group position={[1.38,0,-.03]}><Cyl p={[0,.33,0]} r={.19} r2={.2} h={.53} c='#aebcbb'/><Sphere p={[0,.58,0]} r={.18} c='#bfcac6' scale={[1,.45,1]}/><Cyl p={[0,.68,0]} r={.06} h={.11} c={R}/><Ring p={[0,.706,0]} r={.1} t={.015} c='#d1d4c7'/></group>
 <group position={[-1.42,0,.45]}><Cyl p={[0,.42,0]} r={.19} h={.075} c={R}/>{[0,1,2].map(i=><Cyl key={i} p={[Math.sin(i*2.094)*.13,.21,Math.cos(i*2.094)*.13]} r={.019} h={.38} c='#5f6b69' kind="metal" seg={10}/>)}</group>
 <Person x={.05} z={-.81} c='#35516a' scale={.92} chef f={f}/>
 </Piece>}
 </group>;}

function makeCartKit(){const groups=new Map<string,T.BufferGeometry[]>();const add=(g:T.BufferGeometry,c:string,p:number[],rot=[0,0,0])=>{const matrix=new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(1,1,1));const copy=(g.index?g.toNonIndexed():g.clone()).applyMatrix4(matrix);if(!groups.has(c))groups.set(c,[]);groups.get(c)!.push(copy);};
 const box=(p:number[],s:number[],c:string,r=.035)=>add(rounded(s,r),c,p);
 const cyl=(p:number[],r:number,h:number,c:string,rot=[0,0,0])=>add(new T.CylinderGeometry(r,r,h,16),c,p,rot);
 box([0,.55,0],[1.94,.78,1.12],'#d6d8d0');box([0,.93,0],[2.14,.14,1.3],'#c99f61');box([-.17,.54,.58],[1.48,.46,.035],'#b2bcbc');
 for(const x of [-.62,.62]){cyl([x,.22,0],.245,1.27,'#272d30',[Math.PI/2,0,0]);for(const z of [-.665,.665])cyl([x,.22,z],.11,.025,'#9caaa9',[Math.PI/2,0,0]);}
 for(const x of [-.9,.9])for(const z of [-.53,.53])cyl([x,1.48,z],.027,1.15,'#667274');
 for(let i=0;i<7;i++){const c=i%2===0?R:'#f1efdf';box([-.96+i*.32,2.06,-.1],[.319,.075,1.42],c,.015);cyl([-.96+i*.32,1.98,.62],.113,.319,c,[0,0,Math.PI/2]);}
 cyl([.35,1.027,.06],.407,.055,'#303638');cyl([.35,1.061,.06],.338,.018,'#e3c877');
 return Array.from(groups,([c,gs])=>({c,g:mergeGeometries(gs,false)!}));}
let cartKit:ReturnType<typeof makeCartKit>;
export function Population({f,scale=1,final=false}:any){if(!cartKit)cartKit=makeCartKit();const meshes=useRef<T.InstancedMesh[]>([]);useLayoutEffect(()=>{const dummy=new T.Object3D();for(let i=0;i<100;i++){const col=i%10,row=Math.floor(i/10);let x:number,z:number,y=0,a=1;
 if(final){x=(col-4.5)*2.7+8.2;z=(row-4.5)*2.25;a=1;}
 else{const e1=ease((f-427)/34),e2=ease((f-487)/38);const fromX=i===0?.55:3.25;const fromZ=-.6;const tenX=(i%5-2)*2.7,tenZ=(Math.floor(i/5)-.5)*2.25;const fullX=(col-4.5)*2.7,fullZ=(row-4.5)*2.25;
 if(i<2){x=mix(fromX,tenX,e1);z=mix(fromZ,tenZ,e1);}else{x=tenX;z=tenZ;}
 if(i<10){x=mix(x,fullX,e2);z=mix(z,fullZ,e2);}else{x=fullX;z=fullZ;}
 const born=i===0?-999:i===1?365:i<10?427+Math.floor(i/5)*4+(i%5)*1.5:487+(col+row)*1.65;
 a=f<born?.00001:1;y=f<born?0:drop(f-born,21);}
 dummy.position.set(x*scale,y*scale,z*scale);dummy.rotation.set(0,0,0);dummy.scale.setScalar(scale*a);dummy.updateMatrix();for(const m of meshes.current)if(m)m.setMatrixAt(i,dummy.matrix);
 }for(const m of meshes.current)if(m){m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();}},[f,scale,final]);return <>{cartKit.map(({c,g},i)=><instancedMesh key={c} ref={el=>{if(el)meshes.current[i]=el;}} args={[g,material(c),100]} castShadow receiveShadow frustumCulled={false}/>)}</>;}

export function Stage({w=10,d=6,road=false}:any){return <group><Box p={[0,-.25,0]} s={[w,.46,d]} c='#30383d' r={.09}/><Box p={[0,-.006,0]} s={[w-.06,.085,d-.06]} kind="stone" r={.025}/>
 {Array.from({length:Math.floor(w/1.05)},(_,i)=><Box key={'x'+i} p={[-w/2+(i+1)*1.05,.039,road?-.56:0]} s={[.009,.003,road?d-1.2:d-.1]} c='#c4c8be' r={0} cast={false}/>)}
 {Array.from({length:Math.floor(d/1.05)},(_,i)=>{const z=-d/2+(i+1)*1.05;return road&&z>d/2-1.2?null:<Box key={'z'+i} p={[0,.04,z]} s={[w-.1,.003,.009]} c='#c4c8be' r={0} cast={false}/>;})}
 {road&&<><Box p={[0,.045,d/2-.58]} s={[w-.08,.025,1.08]} c='#3e464c' r={.012}/><Box p={[0,.066,d/2-1.12]} s={[w-.1,.044,.09]} c='#e5e5d8' r={.015}/>{Array.from({length:Math.floor(w/1.3)},(_,i)=><Box key={i} p={[-w/2+.65+i*1.3,.063,d/2-.58]} s={[.56,.004,.045]} c='#e3e5de' cast={false} r={.004}/>)}</>}
 </group>;}
export function StreetLamp({x,z}:any){return <group position={[x,0,z]}><Cyl p={[0,.05,0]} r={.13} h={.1} c='#697574' kind="metal"/><Cyl p={[0,1.31,0]} r={.037} h={2.55} c='#667372' kind="metal"/><Box p={[.19,2.56,0]} s={[.5,.08,.12]} c='#747f7b' r={.04}/><Box p={[.23,2.516,0]} s={[.35,.007,.075]} c='#e8e6cd' r={.01}/></group>;}
export function Tree({x,z}:any){return <group position={[x,0,z]}><AO w={1.7} d={1.4} a={.25}/><Cyl p={[0,.64,0]} r={.06} h={1.25} c='#8d7957'/><Sphere p={[0,1.45,0]} r={.52} c='#78a178' scale={[.9,1.3,.82]}/><Sphere p={[-.25,1.2,.06]} r={.35} c='#87ad7e'/></group>;}
export function Coin({y=0,r=.3}:any){return <group position={[0,y,0]}><Cyl p={[0,.047,0]} r={r} h={.094} c={GOLD} kind="metal"/><Cyl p={[0,.096,0]} r={r*.88} h={.008} c='#d9ad4d' kind="metal"/><Ring p={[0,.105,0]} r={r*.74} t={.009} c='#efd071'/>{Array.from({length:20},(_,i)=><Box key={i} p={[Math.sin(i*Math.PI/10)*(r-.006),.048,Math.cos(i*Math.PI/10)*(r-.006)]} s={[.009,.049,.007]} c='#d9b255' rot={[0,i*Math.PI/10,0]} r={.002}/>)}</group>;}
export function Coins({f,start=300,x=0,z=0,n=7}:any){return <group position={[x,0,z]}><AO w={1.25} d={1.05} a={.4}/>{Array.from({length:n},(_,i)=>{const age=f-start-i*3;return age<0?null:<group key={i} position={[0,drop(age,13),0]} rotation={[0,i*.11,Math.sin(sat(age/13)*Math.PI)*.13]}><Coin y={i*.105}/></group>;})}</group>;}
export function Flag({f=0}:any){const geo=useMemo(()=>new T.PlaneGeometry(.66,.37,12,4),[]);useLayoutEffect(()=>{const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sin((x+.33)*11-f*.12)*(x+.33)*.065);}p.needsUpdate=true;geo.computeVertexNormals();},[f,geo]);return <group><Cyl p={[0,.57,0]} r={.022} h={1.2} c='#4c5755' kind="metal"/><mesh geometry={geo} position={[.33,.99,0]} castShadow><meshStandardMaterial color={R} side={T.DoubleSide} roughness={.82}/></mesh></group>;}
export function Staircase({f,gold=false,x=0,z=0,scale=1}:any){return <group position={[x,0,z]} scale={scale}>
 {Array.from({length:7},(_,row)=>Array.from({length:row+1},(_,layer)=>{const index=row*(row+1)/2+layer;const born=gold?558+index*2:8+index*4.2;const duration=gold?18:12;const age=f-born;if(age< -9)return null;const t=sat(age/duration);const height=3.9;const y=age<0?height+(-age)*.08:age<duration?height*(1-t*t):Math.abs(Math.sin((age-duration)*.85))*Math.exp(-(age-duration)/3)*.055;return <group key={row+'-'+layer} position={[0,y,0]} rotation={[0,age<duration?(1-t)*.08:0,age<duration?Math.sin(t*Math.PI)*.025:0]}><Box p={[0,.17+layer*.335,-row*.51]} s={[1.62,.322,.5]} c={gold?GOLD:'#eeede3'} kind={gold?'gold':'paint'} r={.028}/></group>;}))}
 <group position={[.43,2.35,-3.05]} scale={settle(f-(gold?634:143),18)}><Flag f={f}/></group></group>;}

export function Camera({zoom:z0=80,target=[0,.7,0],angle:a0=0}:any){const {camera}=useThree();const v=useContext(ViewCtx);const zoom=z0*v.zoomScale*v.zoomMul;const angle=a0+v.angleOffset;useLayoutEffect(()=>{// 正交相机：沿同一视线后退 6 倍，避免竖版低 zoom 时地面被近裁剪面切掉（画面不变）。
 const K=6;camera.position.set(target[0]+K*(12*Math.cos(angle)+15*Math.sin(angle)),target[1]+K*13.1,target[2]+K*(15*Math.cos(angle)-12*Math.sin(angle)));camera.lookAt(target[0],target[1],target[2]);(camera as T.OrthographicCamera).zoom=zoom;camera.updateProjectionMatrix();},[camera,zoom,angle,...target]);return null;}
export function Lighting(){const {gl,scene}=useThree();useLayoutEffect(()=>{gl.toneMapping=T.ACESFilmicToneMapping;gl.toneMappingExposure=1.01;gl.shadowMap.type=T.PCFShadowMap;const pmrem=new T.PMREMGenerator(gl);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.26;return()=>{scene.environment=null;env.dispose();room.dispose();pmrem.dispose();};},[gl,scene]);return <><color attach="background" args={['#b9c5ce']}/><ambientLight intensity={.22}/><hemisphereLight args={['#edf1f4','#73818a',.55]}/><directionalLight position={[-7,12,7]} intensity={2.1} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-19} shadow-camera-right={19} shadow-camera-top={19} shadow-camera-bottom={-19} shadow-camera-far={65} shadow-bias={-.00015} shadow-normalBias={.025} shadow-radius={2.2}/><directionalLight position={[5,8,-8]} color="#e4ebee" intensity={.6}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.5,0]} receiveShadow><planeGeometry args={[800,800]}/><meshStandardMaterial color="#b9c5ce" roughness={1}/></mesh></>;}
