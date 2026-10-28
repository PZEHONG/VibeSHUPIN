import React from 'react';
import {between} from '../data/types';
import {paper as P} from '../themes/literary';
import {Figure} from '../components/Paper';

// Courtroom objects are interpretive illustrations, not a reconstruction of a specific room.
export const MockingbirdScene: React.FC<{type: string; progress: number}> = ({type, progress}) => {
  const p = between(progress, .08, .86);
  const wall = <><path d="M100 1130H980M170 580V1130M910 580V1130" stroke={P.ink} opacity=".32" strokeWidth="3"/>
    <path d="M170 640H910M170 680H910" stroke={P.gold} opacity=".45" strokeWidth="3"/></>;
  const pages = <g transform={`translate(${20*p} ${-15*p}) rotate(${-3+3*p} 540 850)`}>
    <rect x="323" y="571" width="442" height="570" rx="4" fill="#d5c7ad" opacity=".4"/>
    <rect x="300" y="550" width="442" height="570" rx="4" fill="#f5eddb" stroke={P.ink} strokeWidth="3"/>
    {[0,1,2,3,4,5,6].map(i=><path key={i} d={`M350 ${680+i*54}H${i===6?590:690}`} stroke={P.muted} strokeWidth="5" opacity=".48"/>)}
    <path d="M350 630H570" stroke={P.gold} strokeWidth="8" opacity=".7"/>
  </g>;
  return <g>
    {type === 'mock_evidence' && <>{pages}<path d={`M${110+570*p} 480L${480+570*p} 1160H${720+240*p}L${420+310*p} 480Z`} fill={P.ink} opacity=".12"/>
      <circle cx={440+190*p} cy="850" r="105" fill="none" stroke={P.gold} strokeWidth="5" opacity=".65"/>
      <path d={`M${515+190*p} 925l75 75`} stroke={P.gold} strokeWidth="12" strokeLinecap="round"/></>}
    {type === 'mock_defense' && <>{wall}<rect x="130" y="1000" width="820" height="42" fill="#b8a58b"/>
      <path d="M190 1042H890V1200H190Z" fill="#d8c7aa" stroke={P.ink} strokeWidth="3"/>
      <Figure x={350} y={1000} scale={1.8} color="#3e3b37"/><Figure x={690-70*p} y={1000} scale={1.8}/>
      <g transform={`translate(${50*p} 0)`}><rect x="465" y="937" width="110" height="48" fill="#f5eddb" stroke={P.gold} strokeWidth="3"/></g></>}
    {type === 'mock_crowd' && <>{wall}{Array.from({length:7},(_,i)=><Figure key={i} x={160+i*125} y={1010+(i%2)*35} scale={1.55} color={i===3?'#81796b':P.ink}/>)}
      <g opacity={.85-.6*p} transform={`translate(0 ${70*p})`}><path d="M115 620H965V795H115Z" fill="#81796b" opacity=".36"/>
      <path d="M145 665H935M145 710H935M145 755H935" stroke={P.ink} strokeWidth="10" opacity=".45"/></g>{pages}</>}
    {type === 'mock_court' && <>{wall}<path d="M210 1190H870L930 1280H150Z" fill="#c6b496"/>
      <path d="M310 1010H770V1170H310Z" fill="#d0bea1" stroke={P.ink} strokeWidth="4"/>
      <path d="M250 1000H830" stroke={P.ink} strokeWidth="12"/>
      <Figure x={210+200*p} y={1170} scale={2} walk={p<.85?progress*30:0}/>
      <path d="M490 1040H750M490 1085H750" stroke={P.gold} opacity=".55" strokeWidth="3"/></>}
    {type === 'mock_gallery' && <>{wall}<path d="M105 1050H975V1130H105ZM105 1200H975V1280H105Z" fill="#c3ae8f" stroke={P.ink} strokeWidth="3"/>
      {[225,390,730,860].map((x,i)=><Figure key={x} x={x} y={1050} scale={1.25} color={i===1?P.gold:P.ink}/>)}
      <Figure x={520} y={1190} scale={1.05}/><path d={`M555 990Q${625+30*p} 940 730 960`} fill="none" stroke={P.gold} strokeWidth="5" opacity={.25+.6*p}/>
      <circle cx="730" cy="960" r={20+8*p} fill="none" stroke={P.gold} strokeWidth="3"/></>}
    {type === 'mock_voice' && <>{pages}<g opacity={.15+.8*p}>
      <path d="M160 1060Q540 900 920 1060M190 1110Q540 970 890 1110M225 1160Q540 1040 855 1160" fill="none" stroke={P.gold} strokeWidth="5"/>
      <circle cx="540" cy="960" r={22+30*p} fill="none" stroke={P.gold} strokeWidth="4"/>
      </g></>}
  </g>;
};
