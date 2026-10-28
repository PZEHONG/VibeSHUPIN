import React from 'react';
import {between, smooth} from '../data/types';
import {paper as P} from '../themes/literary';
import {Figure, SceneLabel} from '../components/Paper';

const Door: React.FC<{x: number; marked?: boolean; scale?: number}> = ({x, marked, scale = 1}) => <g
  transform={`translate(${x} 1000) scale(${scale})`}>
  <path d="M-89 0V-225Q-89-330 0-330Q89-330 89-225V0Z" fill={P.line} opacity=".25" transform="translate(9 9)"/>
  <path d="M-89 0V-225Q-89-330 0-330Q89-330 89-225V0Z" fill={P.light} stroke={marked ? P.gold : '#8B8C7F'} strokeWidth={marked ? 3 : 1.5}/>
  <path d="M-70 0V-225Q-70-307 0-307Q70-307 70-225V0Z" fill={marked ? '#D6C39F' : '#D8D4C6'} stroke={P.ink} strokeWidth="1"/>
  <path d="M0-302V0M-60-220H60M-60-110H60" stroke={P.ink} opacity=".2"/>
  <circle cx="37" cy="-126" r="7" fill="none" stroke={P.gold} strokeWidth="3"/>
  {marked && <><rect x="-27" y="-210" width="54" height="44" rx="2" fill={P.light}/>
    <text x="0" y="-180" fontSize="21" textAnchor="middle" fill={P.gold}>一</text></>}
</g>;

export const Corridor: React.FC<{progress: number; cycles: number}> = ({progress, cycles}) => {
  const run = between(progress, .06, .84) * cycles;
  const travel = run >= cycles ? 0 : (run % 1) * 900;
  const returned = between(progress, .83, .94);
  return <>
    <SceneLabel no="I" title="路，还没走完" subtitle="同一扇门 · 同一个起点"/>
    <g>
      <path d="M64 1030H1016L867 1225H214Z" fill="#C9C4B5" opacity=".32"/>
      <path d="M64 1030H1016M115 1090H965M168 1155H912M540 1030V1225M285 1030L214 1225M795 1030L867 1225" stroke={P.line} strokeWidth="1.5"/>
      <path d="M64 588H1016M64 612H1016" stroke={P.line} strokeWidth="1.2"/>
      <defs><clipPath id="corridor-crop"><rect x="65" y="555" width="950" height="490"/></clipPath></defs>
      <g clipPath="url(#corridor-crop)">
        {Array.from({length: 10}, (_, i) => <Door key={i} x={480 + (i-1) * 225 - travel} marked={(i-1) % 4 === 0}/>)}
      </g>
      <path d="M64 1030V560M1016 1030V560" stroke={P.line}/>
      <Figure x={478} y={1150 + Math.sin(run * Math.PI * 16) * (1 - returned) * 2}
        scale={1.35} walk={run * Math.PI * 16}/>
      <path d="M620 1166C760 1166 824 1210 719 1263C635 1305 477 1296 410 1256" fill="none"
        stroke={P.gold} strokeWidth="2" strokeDasharray="5 9" opacity=".65"/>
      <path d="M410 1256l21-3-10 19" fill="none" stroke={P.gold} strokeWidth="2"/>
      <g opacity={returned}>
        <rect x="704" y="1072" width="171" height="44" rx="22" fill={P.light}/>
        <text x="790" y="1102" textAnchor="middle" fill={P.gold} fontSize="23" letterSpacing="3">又回到原点</text>
      </g>
      <circle cx={84 + smooth(progress) * 912} cy="1340" r="3" fill={P.gold}/>
      <path d="M84 1340H996" stroke={P.line} strokeWidth="1"/>
    </g>
  </>;
};
