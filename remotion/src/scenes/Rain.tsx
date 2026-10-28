import React from 'react';
import {between, clamp} from '../data/types';
import {paper as P} from '../themes/literary';
import {Figure, SceneLabel} from '../components/Paper';

export const Rain: React.FC<{progress: number; stopAt: number; localFrame: number}> = ({progress, stopAt, localFrame}) => {
  const stopped = between(progress, stopAt - .05, stopAt + .08);
  const rain = 1 - stopped;
  return <>
    <SceneLabel no="III" title="雨停了，人还在" subtitle="马孔多 · 漫长的停留"/>
    <defs>
      <linearGradient id="rain-wash" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#B1BDC0" stopOpacity=".58"/><stop offset="1" stopColor="#B1BDC0" stopOpacity="0"/>
      </linearGradient>
      <clipPath id="rain-crop"><rect x="64" y="530" width="952" height="787"/></clipPath>
    </defs>
    <g clipPath="url(#rain-crop)">
      <rect x="64" y="530" width="952" height="787" fill="url(#rain-wash)" opacity={.75 - stopped * .4}/>
      {[{x: 120, y: 879, w: 242, h: 215}, {x: 390, y: 839, w: 225, h: 255}, {x: 648, y: 908, w: 301, h: 186}].map((house, i) => <g key={i}>
        <path d={`M${house.x} ${house.y}l${house.w/2}-${58 + i*10} ${house.w/2} ${58 + i*10}Z`}
          fill="#65757A" opacity=".76"/>
        <rect x={house.x+10} y={house.y} width={house.w-20} height={house.h} fill={['#B7B9AD', '#ADB4AC', '#BAC0B4'][i]}/>
        {[.22, .65].map((k, j) => <g key={j}>
          <path d={`M${house.x + house.w*k} ${house.y+37}h42v73h-42Z`} fill="#63716F"/>
          <path d={`M${house.x + house.w*k+21} ${house.y+37}v73m-21-37h42`} stroke={P.bg} opacity=".55"/>
        </g>)}
        <path d={`M${house.x+12} ${house.y+house.h}h${house.w-24}`} stroke={P.ink} opacity=".25"/>
      </g>)}
      <path d="M64 1094H1016V1317H64Z" fill="#C1C7BC" opacity=".4"/>
      <path d="M120 1195l210-5m316-42 245 4M165 1260l162-5m288 27 227-6" stroke="#879992" opacity=".3" strokeWidth="2"/>
      {Array.from({length: 95}, (_, i) => {
        const x = 72 + ((i * 137.39) % 957);
        const y = 470 + ((i * 91.73 + localFrame * (17 + i%4)) % 890);
        return <path key={i} d={`M${x} ${y}l-14 64`} stroke="#687F8C" opacity={rain * (.18 + (i%3)*.07)} strokeWidth="1.3"/>;
      })}
      <Figure x={550} y={1220} scale={1.22}/>
      <path d="M533 1239l-9 53h50l-10-53Z" fill={P.ink} opacity=".055"/>
      <path d="M475 1243q74-12 148 0m-129 9q54-10 109 0" fill="none" stroke={P.blue} opacity=".28"/>
      <g opacity={rain}>
        <text x="540" y="654" fontSize="72" textAnchor="middle" fill="#556A72" letterSpacing="6">四年十一个月</text>
        <path d="M322 693H758" stroke="#829293" strokeWidth="1"/>
        <circle cx={322 + 436 * clamp(progress / stopAt)} cy="693" r="4" fill="#556A72"/>
      </g>
      <g opacity={stopped}>
        <text x="540" y="655" fontSize="70" textAnchor="middle" fill={P.ink} letterSpacing="10">仍在原地</text>
        <path d="M448 694H632" stroke={P.gold} strokeWidth="1.5"/>
      </g>
    </g>
  </>;
};
