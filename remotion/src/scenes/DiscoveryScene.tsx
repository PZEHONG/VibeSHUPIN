import React from 'react';
import {discoveryHandGeometry, discoveryPose} from '../components/discovery-pose';

// Project-specific layered drawing. Every pose comes from the frame time.
export const DiscoveryScene: React.FC<{seconds:number}> = ({seconds}) => {
 const s=discoveryPose(seconds), reach=s.reach, bend=s.fingerCurl;
 const cam=1+0.13*s.camera, sx=540-540*cam, sy=850-850*cam;
 const hand=discoveryHandGeometry(seconds);
 return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0}}>
 <defs>
  <linearGradient id="d-sky" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#23383a"/><stop offset=".53" stopColor="#63745e"/><stop offset="1" stopColor="#a68b62"/></linearGradient>
  <radialGradient id="d-sun"><stop stopColor="#f7d89e" stopOpacity=".7"/><stop offset="1" stopColor="#f7d89e" stopOpacity="0"/></radialGradient>
  <linearGradient id="d-trunk" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#252a22"/><stop offset=".24" stopColor="#5d4936"/><stop offset=".51" stopColor="#87684a"/><stop offset=".72" stopColor="#5b4733"/><stop offset="1" stopColor="#272d26"/></linearGradient>
  <radialGradient id="d-cavity"><stop stopColor="#20251e"/><stop offset=".65" stopColor="#101815"/><stop offset="1" stopColor="#3c3023"/></radialGradient>
  <linearGradient id="d-skin" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e2be9a"/><stop offset=".5" stopColor="#c99a76"/><stop offset="1" stopColor="#8b6048"/></linearGradient>
  <linearGradient id="d-sleeve" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a4a088"/><stop offset="1" stopColor="#515e50"/></linearGradient>
  <radialGradient id="d-shadow"><stop stopColor="#101410" stopOpacity="0"/><stop offset="1" stopColor="#101410" stopOpacity=".58"/></radialGradient>
  <clipPath id="d-opening"><path d="M467 572 C382 588 344 699 351 803 C357 870 375 919 376 970 C377 1042 430 1135 529 1158 C613 1179 692 1130 714 1047 C732 978 707 923 720 860 C749 735 699 607 616 579 C570 558 513 563 467 572Z"/></clipPath>
 </defs>
 <rect width="1080" height="1920" fill="url(#d-sky)"/><ellipse cx="790" cy="285" rx="450" ry="480" fill="url(#d-sun)"/>
 <path d="M0 790Q150 695 311 754T650 744T1080 672V1920H0Z" fill="#4d6652"/><path d="M0 1080Q270 916 491 1014T1080 940V1920H0Z" fill="#465646"/>
 <g fill="#263f34" opacity=".68">{Array.from({length:22},(_,i)=><path key={i} d={`M${i*66-85} 490q-25 -110 27 -210q50 20 65 110q30 -90 75 -90q48 100 10 215Z`}/>)}</g>
 <g transform={`translate(${sx} ${sy}) scale(${cam})`}>
  <path d="M118 1920 Q253 1763 258 1503 C264 1315 255 1164 264 996 C274 807 235 677 252 475 C260 300 213 134 162 -30 L906 -30 C844 135 822 300 827 465 C833 651 800 786 808 1000 C818 1264 793 1443 819 1592 Q840 1770 979 1920Z" fill="url(#d-trunk)"/>
  <g fill="none" strokeLinecap="round">{Array.from({length:30},(_,i)=>{let x=215+i*22;return <g key={i} opacity={.15+(i%4)*.035}><path d={`M${x} -50 Q${x+25+(i%5)*8} 230 ${x+8} 440 T${x+4} 910 Q${x-10} 1170 ${x+10} 1410 T${x-18} 1970`} stroke={i%3===0?'#e2b786':'#161e19'} strokeWidth={2+(i%4)*2}/><path d={`M${x+8} ${180+(i%7)*190}q25 28 1 75`} stroke="#d7b18b" strokeWidth="2"/></g>;})}</g>
  <path d="M458 548 C363 558 313 686 320 811 C327 893 350 947 346 994 C347 1099 414 1183 518 1196 C625 1209 719 1163 746 1060 C764 986 739 925 753 853 C783 721 722 582 626 550 C578 531 515 533 458 548Z" fill="#342a21" stroke="#a0815b" strokeWidth="14"/>
  <path d="M467 572 C382 588 344 699 351 803 C357 870 375 919 376 970 C377 1042 430 1135 529 1158 C613 1179 692 1130 714 1047 C732 978 707 923 720 860 C749 735 699 607 616 579 C570 558 513 563 467 572Z" fill="url(#d-cavity)"/>
  <g clipPath="url(#d-opening)">
   <path d="M326 1060 Q472 1005 568 1053 Q658 1015 751 1069 L756 1210 H316Z" fill="#665642"/>
   <path d="M336 1068Q487 1022 581 1069T750 1070" fill="none" stroke="#ae9169" strokeWidth="6" opacity=".55"/>
   <g opacity={.22+.78*s.reveal}>
    <g transform="translate(428 1020) rotate(-13)"><rect x="-29" y="-17" width="72" height="35" rx="5" fill="#dad7b8" stroke="#8e8067" strokeWidth="3"/><path d="M-20 -8h48M-20 1h48" stroke="#9a927c" strokeWidth="2"/></g>
    {[0,1,2].map(i=><g key={i} transform={`translate(${505+i*23} ${1071-(i%2)*7}) rotate(${i*20})`}><ellipse rx="15" ry="11" fill="#977748" stroke="#d1b27a" strokeWidth="3"/><path d="M-5 0h10" stroke="#d8c08a" strokeWidth="2"/></g>)}
    {[0,1].map(i=><g key={i} transform={`translate(${584+i*47} ${1011+i*8}) rotate(${i?7:-8})`} fill="#d6c9a5" stroke="#9c8c6d" strokeWidth="3"><ellipse cy="-30" rx="12" ry="14"/><path d="M-12 -16Q0 -22 12 -16L19 25Q0 32 -19 25Z"/><path d="M-7 -34h1m13 0h1M0 -3v20" fill="none"/></g>)}
   </g>
   <path d="M317 1000Q480 969 775 1050L775 1090Q565 1015 318 1045Z" fill="#221f1a" opacity=".4"/>
  </g>
  <path d="M350 925Q349 1097 443 1153 M702 691Q752 784 725 886" fill="none" stroke="#d4ae7e" strokeWidth="7" opacity=".3"/>
 </g>
 <g transform={`translate(${hand.x} ${hand.y}) rotate(${hand.rotationDegrees})`}>
  <path d="M-52 175 C-55 252 -28 375 10 570 L210 560 C166 430 140 293 137 165 L100 87 L-9 81Z" fill="url(#d-sleeve)" stroke="#475248" strokeWidth="6"/>
  <path d="M-45 192 Q33 215 133 186 L147 235 Q41 262 -36 243Z" fill="#b0aa91" stroke="#6c7060" strokeWidth="5"/>
  <path d="M-29 99 C-42 69 -48 30 -42 4 C-36 -26 -26 -53 -3 -64 C26 -79 78 -74 105 -49 C124 -31 129 7 120 34 C111 57 105 77 100 99 C61 121 7 124 -29 99Z" fill="url(#d-skin)" stroke="#805d49" strokeWidth="5"/>
  <path d="M-29 25 C-56 6 -76 -30 -93 -49 C-107 -65 -125 -60 -126 -46 C-124 -27 -98 8 -78 35 C-66 52 -48 67 -36 69Z" fill="url(#d-skin)" stroke="#805d49" strokeWidth="5"/>
  {[0,1,2,3].map((i)=>{const x=-18+i*30, len=[92,118,110,80][i], angle=[-14,-5,5,14][i]+bend*[13,26,32,25][i];return <g key={i} transform={`translate(${x} -49) rotate(${angle})`}><path d={`M-14 7 Q-17 ${-len*.42} -12 ${-len+12} Q-10 ${-len-2} 0 ${-len-2} Q12 ${-len-1} 13 ${-len+12} L14 9Z`} fill="url(#d-skin)" stroke="#805d49" strokeWidth="4"/><path d={`M-8 ${-len+13}q8 -6 16 0`} fill="none" stroke="#f0d3ba" strokeWidth="3" opacity=".8"/><path d={`M-10 ${-len*.48}q10 4 20 0`} fill="none" stroke="#9f7359" strokeWidth="2" opacity=".65"/></g>})}
  <path d="M-15 10Q29 -8 85 6M-5 49Q42 36 87 45" fill="none" stroke="#9c7158" strokeWidth="3" opacity=".45"/>
 </g>
 <g transform={`translate(${-95*s.camera} ${30*s.camera})`} fill="none" stroke="#273a2e" strokeLinecap="round" opacity=".9"><path d="M-65 1520 Q180 1190 255 826 Q285 650 180 430" strokeWidth="38"/><path d="M83 1290Q190 1130 315 1108 M240 905Q112 805 52 689" strokeWidth="18"/><path d="M65 700q35 -100 118 -89q-21 95 -118 89 M276 1108q46 -102 129 -78q-31 91 -129 78" fill="#43543a" stroke="#43543a" strokeWidth="6"/></g>
 <rect width="1080" height="1920" fill="url(#d-shadow)" pointerEvents="none"/>
 </svg>;
};
