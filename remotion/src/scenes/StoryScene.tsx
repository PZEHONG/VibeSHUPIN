import React from 'react';
import {treeState, courtState, giftProgress} from '../components/story-motion';

// The visual elements below are drawn by SVG and animated from the current frame;
// no imported artwork or pre-rendered image is involved.
export const StoryScene: React.FC<{kind: string; progress: number; frame: number}> = ({kind, progress, frame}) => {
 const p = progress, tree = treeState(p), court = courtState(p);
 const sway = Math.sin(frame * .025);
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
  <defs>
   <linearGradient id="sky" x2="0" y2="1"><stop stopColor="#243d42"/><stop offset=".55" stopColor="#8b9b7d"/><stop offset="1" stopColor="#c19a6a"/></linearGradient>
   <linearGradient id="wood" x2="1" y2="0"><stop stopColor="#29291f"/><stop offset=".3" stopColor="#6b4e35"/><stop offset=".6" stopColor="#92704c"/><stop offset="1" stopColor="#302e27"/></linearGradient>
   <radialGradient id="hole"><stop stopColor="#090e0d"/><stop offset=".7" stopColor="#252820"/><stop offset="1" stopColor="#534231"/></radialGradient>
   <linearGradient id="floor" x2="0" y2="1"><stop stopColor="#a88d68"/><stop offset="1" stopColor="#282b2c"/></linearGradient>
   <linearGradient id="wall" x2="0" y2="1"><stop stopColor="#5b6d60"/><stop offset="1" stopColor="#252d2b"/></linearGradient>
   <radialGradient id="light"><stop stopColor="#f5dea2" stopOpacity=".48"/><stop offset="1" stopColor="#f5dea2" stopOpacity="0"/></radialGradient>
   <clipPath id="tree-hole"><ellipse cx="540" cy="1015" rx="155" ry="247"/></clipPath>
  </defs>
 {kind === 'story_tree' ? <>
  <rect width="1080" height="1920" fill="url(#sky)"/>
  <circle cx="850" cy="360" r="390" fill="url(#light)"/>
  <path d="M0 780 Q250 680 450 780 T1080 730 V1920 H0Z" fill="#6a795c"/>
  <path d="M0 1120 Q280 1020 500 1110 T1080 1050 V1920 H0Z" fill="#786f4f"/>
  <g fill="#394c3c" opacity=".65" transform={`translate(${sway*3} 0)`}>
   {Array.from({length:18},(_,i)=><ellipse key={i} cx={i*76-70} cy={240+(i%3)*70} rx="96" ry="130"/>)}
  </g>
  <path d="M236 1920 Q310 1650 310 1420 Q332 1110 300 750 Q285 390 180 0 H910 Q790 380 772 750 Q740 1120 780 1420 Q790 1690 920 1920Z" fill="url(#wood)"/>
  <g fill="none" strokeLinecap="round">
   {Array.from({length:17},(_,i)=><path key={i} d={`M${260+i*35} -30 Q${320+i*31} 420 ${275+i*32} 820 T${300+i*30} 1580 Q${290+i*31} 1740 ${240+i*37} 1950`} stroke={i%3?'#c4a47a':'#252b26'} strokeWidth={2+i%4*2} opacity={i%3?.18:.36}/>)}
   {Array.from({length:14},(_,i)=><path key={i} d={`M${310+i*31} ${390+(i%4)*210} q${35-i%3*14} 48 0 90`} stroke="#e1c696" strokeWidth="3" opacity=".16"/>)}
  </g>
  <ellipse cx="540" cy="1015" rx="184" ry="276" fill="#4f3c2d" stroke="#a1835e" strokeWidth="15"/>
  <ellipse cx="540" cy="1015" rx="155" ry="247" fill="url(#hole)"/>
  <g clipPath="url(#tree-hole)">
   <ellipse cx="540" cy="1205" rx="150" ry="38" fill="#786449" opacity=".6"/>
   <g transform={`translate(0 ${15*(1-tree.gifts)})`} opacity={tree.gifts*(1-tree.seal)}>
    <rect opacity={giftProgress(p,0)} x="433" y="1130" width="74" height="34" rx="4" fill="#c7c7a2" transform="rotate(-10 470 1147)"/>
    {[0,1,2].map(i=><circle opacity={giftProgress(p,1)} key={i} cx={520+i*22} cy={1151-i%2*10} r="13" fill="#c19c5e" stroke="#e1c68b" strokeWidth="2"/>)}
    <g opacity={giftProgress(p,2)} fill="#ddd1aa" stroke="#8a785c" strokeWidth="3">
     {[0,1].map(i=><g key={i} transform={`translate(${452+i*48} 1058)`}><circle cy="0" r="12"/><path d="M-13 16 Q0 9 13 16 L18 58 H-18Z"/></g>)}
    </g>
    <g opacity={giftProgress(p,3)}><circle cx="597" cy="1104" r="27" fill="#c6a96e" stroke="#e3c889" strokeWidth="5"/><circle cx="597" cy="1104" r="20" fill="#e1d5ad"/><path d="M597 1090v14l10 8" stroke="#534838" strokeWidth="3" fill="none"/></g>
   </g>
   <ellipse cx="540" cy="1015" rx="155" ry={247*tree.seal} fill="#a9a798"/>
   <g opacity={tree.seal} stroke="#d9d3c0" strokeWidth="7" fill="none"><path d="M415 970q100 -22 230 3M405 1030q120 20 260 -5M423 1095q110 -9 220 4"/></g>
  </g>
  <g transform={`translate(${-tree.reach*48} ${-tree.reach*205}) rotate(${-tree.reach*8} 355 1580)`}>
   <path d="M-80 1880 Q170 1710 360 1510 L420 1468 Q442 1457 449 1473 Q450 1485 431 1496 L397 1525 Q424 1508 438 1512 Q450 1519 435 1531 L390 1562 Q384 1578 366 1600 L156 1836Z" fill="#c79e78" stroke="#735840" strokeWidth="7"/>
   <path d="M-50 1880 Q120 1760 250 1650 L295 1716 Q150 1850 70 1930Z" fill="#5c6e63"/>
  </g>
  <g transform={`translate(${tree.reach*35} ${-tree.reach*170}) rotate(${tree.reach*9} 800 1640)`}>
   <path d="M1160 1890 Q975 1710 790 1540 L727 1500 Q706 1491 700 1508 Q700 1521 717 1530 L750 1556 Q724 1544 710 1549 Q698 1559 717 1570 L758 1595 Q776 1619 805 1645 L1030 1890Z" fill="#d8b28d" stroke="#85674e" strokeWidth="7"/>
   <path d="M1160 1900 Q1030 1780 916 1682 L869 1745 Q1000 1890 1050 1950Z" fill="#bda082"/>
  </g>
  <rect width="1080" height="1920" fill="#14201f" opacity={.08+.12*tree.seal}/>
 </> : <>
  <rect width="1080" height="1920" fill="url(#wall)"/>
  <path d="M0 1280 L1080 1280 L1080 1920 H0Z" fill="url(#floor)"/>
  <g stroke="#c4bba0" strokeWidth="12" fill="#a9b09d" opacity=".52">
   {[90,380,670,960].map(x=><g key={x}><rect x={x} y="170" width="150" height="760" rx="72"/><path d={`M${x} 520h150M${x+75} 170v760`}/></g>)}
  </g>
  <g stroke="#2a2923" strokeWidth="22" fill="#65543e"><path d="M0 1035H1080V1210H0Z"/><path d="M0 1420H1080V1545H0Z"/><path d="M0 1760H1080V1890H0Z"/></g>
  <g opacity=".6" fill="#202927">{[95,220,350,730,860,985].map((x,i)=><g key={x} transform={`translate(${x} ${1280+(i%2)*12})`}><circle cy="-125" r="33"/><path d="M-55 -75Q0 -110 55 -75L75 80H-75Z"/></g>)}</g>
  <g transform={`translate(540 1240) rotate(${-court.speaker*3})`}>
   <ellipse cy="-235" rx="49" ry="57" fill="#ba9471"/><path d="M-54 -225Q-45 -300 0 -299Q45 -300 53 -225Q25 -253 0 -255Q-28 -255 -54 -225" fill="#252b29"/>
   <path d="M-75 -160Q0 -200 75 -160L112 112H-112Z" fill="#273336"/><path d="M-18 -175L0 -75L18 -175Z" fill="#dad3bb"/>
   <path d={`M-56 -134 Q-140 ${-110-court.speaker*35} -185 ${-54-court.speaker*110}`} fill="none" stroke="#273336" strokeWidth="38" strokeLinecap="round"/>
   <circle cx="-185" cy={-54-court.speaker*110} r="19" fill="#ba9471"/>
  </g>
  <g transform={`translate(${720-court.evidence*70} ${1030-court.evidence*30}) rotate(7)`} opacity={court.evidence}>
   <rect x="-105" y="-140" width="210" height="275" rx="6" fill="#e0d4b4" stroke="#8e785c" strokeWidth="5"/>
   <path d="M-70 -85h125M-70 -48h145M-70 -11h110M-70 26h145M-70 63h95" stroke="#8e826d" strokeWidth="5" opacity=".6"/>
  </g>
  <ellipse cx="520" cy="700" rx="600" ry="850" fill="url(#light)" opacity=".3"/>
 </>}
 </svg>;
};
