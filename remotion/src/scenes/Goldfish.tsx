import React from 'react';
import {between, clamp} from '../data/types';
import {paper as P} from '../themes/literary';
import {SceneLabel} from '../components/Paper';

const Fish: React.FC<{opacity?: number}> = ({opacity = 1}) => <g opacity={opacity}>
  <path d="M-112 0C-72-72 30-76 96-17L153-61L140 0L153 61L96 17C30 76-72 72-112 0Z"
    fill="#C1A167" stroke="#856936" strokeWidth="2"/>
  <path d="M-54-43Q-28 0-54 43M-28-50Q1 0-28 50M0-51Q31 0 0 51M30-43Q60 0 30 43M60-31Q85 0 60 31"
    stroke="#F6E7BD" strokeWidth="2" fill="none"/>
  <path d="M-10-52L20-91L62-44M-6 52L26 81L53 43" fill="#AC8845" stroke="#856936" strokeWidth="1.5"/>
  <circle cx="-72" cy="-8" r="7" fill={P.ink}/><circle cx="-74" cy="-10" r="2" fill={P.light}/>
  <path d="M-111 0l18 9" stroke="#856936" strokeWidth="2" fill="none"/>
</g>;

export const Goldfish: React.FC<{progress: number; cycles: number}> = ({progress, cycles}) => {
  const p = progress >= .96 ? .96 : (progress * cycles) % 1;
  const drop = between(p, .2, .43), melt = between(p, .39, .53), remake = between(p, .64, .84);
  const molten = clamp((p - .38) / .08) * (1 - between(p, .7, .87));
  const formed = between(p, .76, .9);
  return <>
    <SceneLabel no="II" title="把时间，重新熔铸" subtitle="一条小金鱼的往复"/>
    <ellipse cx="540" cy="1120" rx="369" ry="27" fill={P.ink} opacity=".05"/>
    <path d="M164 1100H916M201 1100V1245M877 1100V1245M201 1132H877" fill="none" stroke={P.ink} strokeWidth="3"/>
    <path d="M164 1090H916V1100H164Z" fill="#B6A383"/>
    <g transform={`translate(${430 + drop * 225 - remake * 225} ${742 + drop * 198 - remake * 198}) rotate(${drop * 25 - remake * 25}) scale(${1.06 * (1 - melt) + 1.06 * remake})`}>
      <Fish opacity={1 - melt + remake}/>
    </g>
    <g>
      <ellipse cx="668" cy="1052" rx="94" ry="13" fill={P.gold} opacity=".15"/>
      <path d="M588 933L608 1048Q668 1074 728 1048L748 933Z" fill="#56554B"/>
      <path d="M608 1048Q668 1074 728 1048" stroke={P.ink} strokeWidth="3" fill="none"/>
      <ellipse cx="668" cy="933" rx="80" ry="21" fill="#323A36"/>
      <ellipse cx="668" cy="933" rx={63 * molten} ry={12 * molten} fill="#E0B45F"/>
      <path d="M617 985Q668 1005 720 985" stroke="#BBB39F" opacity=".4" fill="none"/>
      {[0, 1, 2].map(i => <path key={i} d={`M${645 + i * 24} 898q-14-25 0-49t0-40`}
        fill="none" stroke={P.gold} strokeWidth="2" opacity={molten * .45}/>) }
    </g>
    <g opacity={1 - drop} transform="translate(252 1012) scale(.36)"><Fish opacity={.45}/></g>
    <g opacity={formed} transform="translate(380 1012) scale(.36)"><Fish/></g>
    <g transform="translate(185 1278)" fontSize="26" letterSpacing="4">
      {['做好', '熔掉', '再重做'].map((s, i) => <g key={s} transform={`translate(${i * 276} 0)`}>
        <circle cx="0" cy="-10" r="15" fill={i === (p < .3 ? 0 : p < .7 ? 1 : 2) ? P.gold : P.line}/>
        <text x="34" fill={P.ink}>{s}</text>
        {i < 2 && <path d="M144-10H232m-8-5 8 5-8 5" stroke={P.line} fill="none"/>}
      </g>)}
    </g>
  </>;
};
