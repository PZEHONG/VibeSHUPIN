import React from 'react';
import {paper as P} from '../themes/literary';

export const Paper: React.FC<{children: React.ReactNode}> = ({children}) => <svg
  xmlns="http://www.w3.org/2000/svg" width={1080} height={1920} viewBox="0 0 1080 1920"
  style={{position: 'absolute', inset: 0}}>
  <defs>
    <radialGradient id="paper-light" cx="40%" cy="31%" r="86%">
      <stop offset="0" stopColor={P.light}/><stop offset="1" stopColor={P.bg}/>
    </radialGradient>
    <pattern id="paper-fibre" width="73" height="89" patternUnits="userSpaceOnUse">
      <path d="M8 13l8 -.4M36 49l13 .7M19 77l5 -.2M62 24l3 .4" stroke="#8D8269" strokeWidth=".6" opacity=".13"/>
      <circle cx="54" cy="71" r=".8" fill="#8D8269" opacity=".15"/>
    </pattern>
  </defs>
  <rect width={1080} height={1920} fill="url(#paper-light)"/>
  <rect width={1080} height={1920} fill="url(#paper-fibre)"/>
  {children}
</svg>;

export const Figure: React.FC<{x: number; y: number; scale?: number; walk?: number; color?: string}> =
({x, y, scale = 1, walk = 0, color = P.ink}) => <g transform={`translate(${x} ${y}) scale(${scale})`} fill={color}>
  <ellipse cx="0" cy="3" rx="35" ry="6" opacity=".12"/>
  <circle cx="0" cy="-133" r="17"/>
  <path d="M-19-111Q0-119 19-111L29-48Q0-36-29-48Z"/>
  <path d={`M-13-48L${-14 + Math.sin(walk) * 13}-5M13-48L${14 - Math.sin(walk) * 13}-5`}
    stroke={color} strokeWidth="13" strokeLinecap="round" fill="none"/>
  <path d="M-17-103L-31-56M17-103L31-56" stroke={color} strokeWidth="9" strokeLinecap="round" fill="none"/>
</g>;

export const SceneLabel: React.FC<{no: string; title: string; subtitle: string}> = ({no, title, subtitle}) => <g>
  <text x="84" y="330" fill={P.gold} fontSize="24" letterSpacing="5" fontFamily="VibeLatin">{no}</text>
  <text x="84" y="405" fill={P.ink} fontSize="58" letterSpacing="5" fontWeight="500">{title}</text>
  <text x="88" y="455" fill={P.muted} fontSize="23" letterSpacing="3">{subtitle}</text>
</g>;
