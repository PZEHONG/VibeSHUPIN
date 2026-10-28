import React, {useMemo} from 'react';
import {between, clamp, type Shot} from '../data/types';
import {oilFullScenes, tkamScenes} from '../data/types';
import {OilFullScene} from './OilFullScene';
import {KillingMockingbirdScene} from './KillingMockingbirdScene';
import {oilCamera, rainDepth, houseProjection} from '../components/oilMotion';
import {paintCorridor, paintDoor, paintFigure, paintFish, paintPot,
  paintRainBackground, paintRainShore, paintWorkshop, paintFoliage, random} from '../components/oilPaint';

export const OilSurface: React.FC<{children: React.ReactNode}> = ({children}) => {
  return <svg xmlns="http://www.w3.org/2000/svg" width={1080} height={1920} viewBox="0 0 1080 1920"
    style={{position: 'absolute', inset: 0}}>
    <defs><pattern id="oil-linen" width="4" height="4" patternUnits="userSpaceOnUse">
      <path d="M0 0H4M0 0V4" fill="none" stroke="#F4DBC1" strokeWidth=".5" opacity=".035"/>
    </pattern>
      <radialGradient id="oil-vignette"><stop offset=".38" stopColor="#051323" stopOpacity="0"/>
        <stop offset="1" stopColor="#051323" stopOpacity=".36"/></radialGradient>
    </defs>
    {children}
    <rect width="1080" height="1920" fill="url(#oil-vignette)"/>
    <rect width="1080" height="1920" fill="url(#oil-linen)"/>
  </svg>;
};

// Objects are painted once with fixed seeds. Frame values only move completed
// paint layers; neither the impasto nor the canvas weave changes from frame to frame.
type SceneProps = {shot: Shot; progress: number; localFrame: number};
export const OilScene: React.FC<SceneProps> = props => {
  const {scale,x,y}=oilCamera(props.shot.scene_type,props.progress);
  const near=props.shot.scene_type==='market' || props.shot.scene_type==='rain';
  const foliage=useMemo(()=>near ? paintFoliage() : '',[near]);
  const depth = rainDepth(props.progress);
  return <g transform={`translate(${540+x} ${960+y}) scale(${scale}) translate(-540 -960)`}>
    <g>
      {(oilFullScenes as readonly string[]).includes(props.shot.scene_type)
        ? <OilFullScene {...props}/>
        : (tkamScenes as readonly string[]).includes(props.shot.scene_type)
          ? <KillingMockingbirdScene {...props}/> : <ClassicOilScene {...props}/>}
      {near && <g transform={`translate(${-65+(props.shot.scene_type==='rain' ? depth.near.x : -props.progress*22)} ${1195+(props.shot.scene_type==='rain' ? depth.near.y : props.progress*12)})`}>
        <image href={foliage} width="290" height="720"/>
      </g>}
    </g>
  </g>;
};

const houses = [[-20,710,270,470],[250,590,285,600],[590,660,250,540],[830,790,280,400]];

/** Painted front planes and solid side / roof faces move independently in depth. */
const RainHouses: React.FC<{image: string; progress: number}> = ({image, progress}) => <g>
  <defs>
    {houses.map(([x,y,w,h],i)=><clipPath key={i} id={`house-face-${i}`}>
      <rect x={x-16} y={y-65} width={w+32} height={h+70}/>
    </clipPath>)}
    <pattern id="house-side-paint" width="1080" height="1920" patternUnits="userSpaceOnUse">
      <image href={image} width="1080" height="1920"/>
    </pattern>
  </defs>
  {houses.map(([x,y,w,h],i)=>{
    const v=houseProjection(i,progress), right=x+w, back=right+v.sideWidth, rise=v.roofRise;
    const r=random(2700+i);
    const marks=Array.from({length: 48},()=>({x:right+r()*v.sideWidth,y:y+55+r()*(h-65),len:8+r()*22}));
    const roofMarks=Array.from({length: 25},()=>({x:x+w*.47+r()*(w*.53+v.sideWidth),y:y-65-rise+r()*145,len:10+r()*28}));
    const sidePath=`M${right} ${y+48}L${back} ${y+48-rise}V${y+h-rise}L${right} ${y+h}Z`;
    const roofPath=`M${x+w*.47} ${y-60}L${x+w*.47+v.sideWidth} ${y-60-rise}L${back+12} ${y+48-rise}L${right+12} ${y+48}Z`;
    return <g key={i} transform={`translate(${v.frontX} ${v.frontY})`}>
      <defs><clipPath id={`side-${i}`}><path d={sidePath}/></clipPath>
        <clipPath id={`roof-${i}`}><path d={roofPath}/></clipPath></defs>
      <path d={sidePath} fill="#283F4A"/>
      <path d={`M${right} ${y+48}L${back} ${y+48-rise}V${y+h-rise}L${right} ${y+h}Z`} fill="url(#house-side-paint)" opacity=".21"/>
      <path d={roofPath} fill="#384852"/>
      <path d={`M${x+w*.47} ${y-60}L${x+w*.47+v.sideWidth} ${y-60-rise}L${back+12} ${y+48-rise}L${right+12} ${y+48}Z`} fill="url(#house-side-paint)" opacity=".22"/>
      <g clipPath={`url(#side-${i})`} stroke="#8C9C87" strokeWidth="2.5" opacity=".28">
        {marks.map((m,j)=><path key={j} d={`M${m.x} ${m.y}l${m.len*.25} ${-m.len}`}/>)}
      </g>
      <g clipPath={`url(#roof-${i})`} stroke="#A39778" strokeWidth="3" opacity=".32">
        {roofMarks.map((m,j)=><path key={j} d={`M${m.x} ${m.y}l${m.len} ${m.len*.42}`}/>)}
      </g>
      <path d={`M${right+6} ${y+53}L${back} ${y+48-rise}M${right+6} ${y+h-5}L${back} ${y+h-rise}`} fill="none" stroke="#91A495" strokeWidth="3" opacity=".35"/>
      <image href={image} width="1080" height="1920" clipPath={`url(#house-face-${i})`}/>
    </g>;
  })}
</g>;

const ClassicOilScene: React.FC<SceneProps> = ({shot, progress, localFrame}) => {
  const paint = useMemo(() => ({corridor: paintCorridor(), door: paintDoor(), figure: paintFigure(),
    fish: paintFish(), pot: paintPot(), workshop: paintWorkshop(), rain: paintRainBackground(), shore: paintRainShore()}), []);
  const cycles = shot.scene_props.cycles ?? 1;
  const run = between(progress, .05, .88)*cycles;
  const travel = run >= cycles ? 0 : (run%1)*1020;
  // Hold a completed fish after the final cycle rather than snapping to a new loop.
  const p = progress >= .96 ? .96 : (progress*cycles)%1;
  const drop = between(p, .2, .43), melt = between(p, .39, .55), remake = between(p, .64, .85);
  const molten = between(p, .38, .47)*(1-between(p, .72, .88));
  const formed = between(p, .76, .91);
  const depth = rainDepth(progress);
  const stopAt = shot.scene_props.stop_at ?? .6;
  const stop = between(progress, stopAt-.05, stopAt+.08);
  const rainLines = useMemo(() => {const r = random(405); return Array.from({length: 110}, () =>
    ({x: r()*1160, y: r()*1010, speed: 13+r()*9, length: 19+r()*36, alpha: .12+r()*.32}));}, []);
  const ripples = useMemo(() => {const r=random(409); return Array.from({length: 100}, (_,i) =>
    ({x: [140,412,701,959][i%4]+(r()-.5)*92,y: 1210+r()*660,w: 8+r()*43,phase:r()*Math.PI*2}));}, []);
  return <g>
    <defs>
      <radialGradient id="oil-sun"><stop stopColor="#DEB368" stopOpacity=".3"/><stop offset="1" stopColor="#DEB368" stopOpacity="0"/></radialGradient>
      <clipPath id="oil-window"><rect width="1080" height="1920"/></clipPath>
    </defs>
    <g clipPath="url(#oil-window)">
      {shot.scene_type === 'corridor' && <>
        <image href={paint.corridor} width="1080" height="1920"/>
        {[0, 1].map(i => <image key={i} href={paint.door} x={62+i*1020-travel} y="270" width="360" height="816"/>)}
        <ellipse cx="570" cy="1340" rx="125" ry="23" fill="#1E2C27" opacity=".32"/>
        <image href={paint.figure} x={454+Math.sin(run*Math.PI*8)*7} y={930-Math.abs(Math.sin(run*Math.PI*12))*4}
          width="232" height="410"/>
      </>}
      {shot.scene_type === 'goldfish' && <>
        <image href={paint.workshop} width="1080" height="1920"/>
        <g opacity={.8}><image href={paint.fish} x="168" y="1247" width="128" height="73"/>
          <image href={paint.fish} x="280" y="1243" width="108" height="62"/></g>
        <image href={paint.pot} x="665" y="971" width="234" height="225"/>
        <ellipse cx="782" cy="1021" rx={80*molten} ry="16" fill="#E0AF4F" opacity={molten}/>
        <ellipse cx="782" cy="1017" rx={51*molten} ry="5" fill="#FFE2A0" opacity={molten*.7}/>
        <g transform={`translate(${319+drop*330-remake*330} ${650+drop*333-remake*333}) scale(${1-melt*.7+formed*.7} ${Math.max(.025, 1-melt+formed)})`}
          opacity={clamp(1-melt+formed)}><image href={paint.fish} width="315" height="180"/></g>
        {[0, 1, 2].map(i => <path key={i} d={`M${746+i*30} 976q-20 -43 3 -81t-3 -65`}
          fill="none" stroke="#D0BA86" strokeWidth="4" opacity={molten*(.13+Math.sin(localFrame*.06+i)*.05)}
          transform={`translate(0 ${-Math.sin(localFrame*.04+i)*9})`}/>)}
      </>}
      {shot.scene_type === 'rain' && <>
        <image href={paint.rain} width="1080" height="1920"/>
        <RainHouses image={paint.shore} progress={progress}/>
        <g strokeLinecap="round">
          {ripples.map((r,i)=><path key={i}
            d={`M${r.x+Math.sin(localFrame*.035+r.phase)*7} ${r.y}q${r.w*.5} ${Math.sin(localFrame*.028+r.phase)*2} ${r.w} 0`}
            stroke={i%3 ? '#D4B969' : '#7AABBB'} strokeWidth={1+(r.y-1210)/180}
            opacity={.1+(1+Math.sin(localFrame*.035+r.phase))*.07}/>) }
        </g>
        <g transform={`translate(${depth.figure.x} ${depth.figure.y})`}>
          <ellipse cx="590" cy="1340" rx="95" ry="22" fill="#273F45" opacity=".5"/>
          <image href={paint.figure} x="479" y="945" width="222" height="392"/>
        </g>
        <g opacity={1-stop} stroke="#BDCEC7" strokeLinecap="square">
          {rainLines.map((r, i) => {const y = (r.y*2+localFrame*r.speed)%2120-120;
            return <path key={i} d={`M${r.x} ${y}l-14 ${r.length}`} opacity={r.alpha} strokeWidth={i%3 ? 2 : 4}/>;})}
        </g>
        <ellipse cx="395" cy="440" rx="720" ry="900" fill="url(#oil-sun)" opacity={stop}/>
      </>}
    </g>
  </g>;
};
