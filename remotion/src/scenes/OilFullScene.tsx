import React, {useMemo} from 'react';
import {between, type OilFullSceneType, type Shot} from '../data/types';
import {paintFigure, random} from '../components/oilPaint';
import {paintArm, paintBookPage, paintCandle, paintChair, paintFullPlate} from '../components/oilFullPaint';

const Flame: React.FC<{x: number; y: number; frame: number; strength?: number}> = ({x, y, frame, strength = 1}) =>
  <g transform={`translate(${x} ${y}) scale(${strength})`}>
    <defs><radialGradient id="candle-halo"><stop stopColor="#F6CD75" stopOpacity=".35"/>
      <stop offset=".3" stopColor="#D8A34F" stopOpacity=".12"/><stop offset="1" stopColor="#D8A34F" stopOpacity="0"/></radialGradient></defs>
    <ellipse cy="-9" rx="150" ry="190" fill="url(#candle-halo)" opacity={.85+Math.sin(frame*.07)*.08}/>
    <path d={`M0 6Q${-15+Math.sin(frame*.11)*2} -7 1 -31Q16 -5 0 6Z`} fill="#F3D58D"/>
    <path d="M0 3Q-6-5 1-17Q7-3 0 3Z" fill="#FFF0BF"/>
  </g>;

export const OilFullScene: React.FC<{shot: Shot; progress: number; localFrame: number}> = ({shot, progress: p, localFrame: f}) => {
  const scene = shot.scene_type as OilFullSceneType;
  const art = useMemo(() => ({plate: paintFullPlate(scene), figure: paintFigure(),
    arm: scene==='table' || scene==='book' ? paintArm() : '',
    candle: scene==='table' || scene==='empty_table' ? paintCandle() : '',
    chair: scene==='quarrel' ? paintChair() : '',
    page: scene==='book' ? paintBookPage() : '', cover: scene==='book' ? paintBookPage(true) : ''}), [scene]);
  const crowd = useMemo(() => {const r=random(1501); return Array.from({length: 12}, (_, i) =>
    ({x: r()*1550-230, y: 800+r()*340, scale: .52+r()*.9, speed: (i%2 ? 1 : -1)*(1+r()*1.4)}));}, []);
  const reachLeft = between(p, .05, .38)*(1-between(p, .48, .78));
  const reachRight = between(p, .38, .76);
  const leave = between(p, .27, .92);
  const close = between(p, .08, .48);
  const fold = Math.cos(close*Math.PI);
  const ending = scene==='empty_table';
  const flame = ending ? 1-between(p, .25, .9)*.72 : 1;
  return <g>
    <image href={art.plate} width="1080" height="1920"/>
    {scene==='market' && <>
      {crowd.slice(0, 7).map((r, i) => <image key={i} href={art.figure}
        x={((r.x+f*r.speed*.55+1600)%1600)-250} y={r.y+Math.sin(f*.08+i)*1.5} width={170*r.scale} height={300*r.scale} opacity=".8"/>)}
      <ellipse cx="565" cy="1351" rx="125" ry="24" fill="#283A30" opacity=".5"/>
      <image href={art.figure} x="447" y="920" width="245" height="432"/>
      {crowd.slice(7).map((r, i) => <image key={i} href={art.figure}
        x={((r.x-f*r.speed*.7+1600)%1600)-250} y={1130+i*32+Math.sin(f*.09+i)*2} width={190*r.scale} height={335*r.scale} opacity=".9"/>)}
    </>}
    {scene==='portraits' && <>
      <defs><radialGradient id="portrait-light"><stop stopColor="#E8C78B" stopOpacity=".32"/>
        <stop offset="1" stopColor="#E8C78B" stopOpacity="0"/></radialGradient></defs>
      <ellipse cx={160+between(p, .06, .85)*750} cy={620+Math.sin(p*Math.PI)*190}
        rx="280" ry="440" fill="url(#portrait-light)"/>
      <image href={art.figure} x="457" y="1110" width="204" height="360" opacity=".84"/>
    </>}
    {(scene==='table' || ending) && <>
      {scene==='table' && <>
        <image href={art.figure} x="-100" y="720" width="338" height="596"/>
        <image href={art.figure} x="848" y="720" width="338" height="596"/>
        <image href={art.arm} x={68+reachLeft*65} y="990" width="400" height="167"/>
        <g transform={`translate(${1012-reachRight*65} 1022) scale(-1 1)`}>
          <image href={art.arm} width="400" height="167"/>
        </g>
      </>}
      <ellipse cx="548" cy="1100" rx="185" ry="100" fill="#E4B466" opacity={.05*flame}/>
      <image href={art.candle} x="489" y="823" width="120" height="320"/>
      <Flame x={549} y={866} frame={f} strength={flame}/>
      {ending && <rect width="1080" height="1920" fill="#17251F" opacity={between(p, .5, 1)*.14}/>}
    </>}
    {scene==='city' && <>
      {[0, 1, 2, 3, 4].map(i => <path key={i}
        d={`M${((f*(3+i*.3)+i*260)%1350)-170} ${1090+i*14}h${35+i*9}`}
        stroke={i%2 ? '#D9B06B' : '#ACBDB1'} strokeWidth="3" opacity=".44"/>)}
      <ellipse cx="580" cy="1350" rx="110" ry="22" fill="#152C2D" opacity=".5"/>
      <image href={art.figure} x="455" y="907" width="250" height="441"/>
      <path d="M144 85L420 1090M720 80L924 900" stroke="#B4BBA0" strokeWidth="3" opacity=".07"/>
    </>}
    {scene==='quarrel' && <>
      <image href={art.figure} x="125" y="763" width="280" height="494"/>
      <g transform={`translate(${757+leave*440} ${766-Math.sin(leave*Math.PI*9)*4}) scale(${1-leave*.08} 1)`}>
        <image href={art.figure} width="280" height="494"/>
      </g>
      <g transform={`translate(746 1380) rotate(${Math.sin((f-28)*.19)*5*between(p,.3,.4)*(1-between(p,.65,1))})`}>
        <image href={art.chair} x="-110" y="-220" width="220" height="380"/>
      </g>
    </>}
    {scene==='book' && <>
      <ellipse cx="535" cy="1233" rx="380" ry="52" fill="#2C2A23" opacity=".5"/>
      <g transform="translate(540 810) scale(-1 1)"><image href={art.page} width="370" height="460"/></g>
      <g transform={`translate(540 810) scale(${fold} 1)`}>
        <image href={fold >= 0 ? art.page : art.cover} width="370" height="460"/>
      </g>
      <path d="M540 826V1260" stroke="#4D4731" strokeWidth="7"/>
      <g opacity={1-between(p,.55,.73)}
        transform={`translate(${1360-close*260+between(p,.52,.73)*310} ${970-Math.sin(close*Math.PI)*80}) scale(-1 1)`}>
        <image href={art.arm} width="640" height="268"/>
      </g>
      <ellipse cx="822" cy="1540" rx="94" ry="135" fill="#283B31" opacity={between(p,.55,.95)*.13}/>
    </>}
  </g>;
};
