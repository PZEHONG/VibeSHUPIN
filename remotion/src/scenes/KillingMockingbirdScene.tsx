import React, {useMemo} from 'react';
import {between, type Shot} from '../data/types';
import {
  paintTKAMPlate, paintAtticus, paintChild, paintBoy, paintTom, paintBoo, paintHamCostume,
  paintJudge, paintPortrait, paintDoll, paintWatch, paintPennies, paintGum, paintBird,
  paintFeather, paintLantern, paintOpenBook, paintTurnPage, paintMug,
} from '../components/tkamPaint';
import {paintFigure, random} from '../components/oilPaint';

type Props = {shot: Shot; progress: number; localFrame: number};

export const KillingMockingbirdScene: React.FC<Props> = ({shot, progress, localFrame}) => {
  const scene = shot.scene_type as any;
  const p = progress, f = localFrame;
  const art = useMemo(() => {
    const a: Record<string, string> = {plate: paintTKAMPlate(scene)};
    if (scene === 'tkam_town') { a.figure = paintFigure(); a.child = paintChild(); a.boy = paintBoy(); }
    if (scene === 'tkam_porch') { a.atticus = paintAtticus(); a.child = paintChild(); a.boy = paintBoy(); }
    if (scene === 'tkam_portraits') {
      a.scout = paintPortrait('scout'); a.jem = paintPortrait('jem'); a.dill = paintPortrait('dill');
      a.atticus = paintPortrait('atticus'); a.calpurnia = paintPortrait('calpurnia');
      a.boo = paintPortrait('boo'); a.tom = paintPortrait('tom');
    }
    if (scene === 'tkam_boo_house') { a.child = paintChild(); a.boy = paintBoy(); }
    if (scene === 'tkam_tree') {
      a.doll = paintDoll(); a.watch = paintWatch(); a.pennies = paintPennies(); a.gum = paintGum();
    }
    if (scene === 'tkam_court') { a.judge = paintJudge(); a.atticus = paintAtticus(); }
    if (scene === 'tkam_trial') { a.tom = paintTom(); a.atticus = paintAtticus(); }
    if (scene === 'tkam_walk') { a.atticus = paintAtticus(); a.figure = paintFigure(); }
    if (scene === 'tkam_night') { a.ham = paintHamCostume(); a.child = paintChild(); a.boo = paintBoo(); a.lantern = paintLantern(); a.boy = paintBoy(); }
    if (scene === 'tkam_boo_porch') { a.child = paintChild(); a.boo = paintBoo(); a.bird = paintBird(); }
    if (scene === 'tkam_mockingbird') { a.bird = paintBird(); a.feather = paintFeather(); }
    if (scene === 'tkam_reading') { a.book = paintOpenBook(); a.page = paintTurnPage(); a.mug = paintMug(); }
    return a;
  }, [scene]);

  const fireflies = useMemo(() => {
    const r = random(8101);
    return Array.from({length: 22}, (_, i) => ({x: 620 + r() * 440, y: 760 + r() * 700, phase: r() * 6.28, size: 1.6 + r() * 3, i}));
  }, []);
  const dust = useMemo(() => {
    const r = random(8102);
    return Array.from({length: 46}, () => ({x: r() * 1080, y: 180 + r() * 1250, phase: r() * 6.28, s: .8 + r() * 2.4}));
  }, []);
  const rain = useMemo(() => {
    const r = random(8103);
    return Array.from({length: 64}, () => ({x: 198 + r() * 594, y: 250 + r() * 720, len: 22 + r() * 46, sp: 9 + r() * 9, a: .08 + r() * .18}));
  }, []);

  return <g>
    <defs>
      <radialGradient id="tkam-warm"><stop offset="0" stopColor="#F6D18A" stopOpacity=".55"/><stop offset=".55" stopColor="#E8B766" stopOpacity=".18"/><stop offset="1" stopColor="#E8B766" stopOpacity="0"/></radialGradient>
      <radialGradient id="tkam-pale"><stop offset="0" stopColor="#E9E2C8" stopOpacity=".5"/><stop offset="1" stopColor="#E9E2C8" stopOpacity="0"/></radialGradient>
      <radialGradient id="tkam-dark"><stop offset="0" stopColor="#071520" stopOpacity=".55"/><stop offset="1" stopColor="#071520" stopOpacity="0"/></radialGradient>
      <clipPath id="tkam-judge-clip"><rect x="0" y="0" width="1080" height="758"/></clipPath>
    </defs>
    <image href={art.plate} width="1080" height="1920"/>

    {scene === 'tkam_town' && <>
      {[[500, 1150, .42], [546, 1160, .4]].map(([x, y, s], i) =>
        <image key={`a${i}`} href={art.figure} x={x as number} y={(y as number) - 300 * (s as number)}
          width={170 * (s as number)} height={300 * (s as number)} opacity=".75"/>)}
      <image href={art.child} x={426 + p * 14} y={1320 - Math.abs(Math.sin(f * .1)) * 3} width="100" height="200"/>
      <image href={art.boy} x={506 + p * 16} y={1316 - Math.abs(Math.sin(f * .1 + 1)) * 3} width="104" height="208"/>
      {[[205, 820], [915, 820], [360, 895]].map(([x, y], i) =>
        <ellipse key={`w${i}`} cx={x} cy={y} rx="48" ry="60" fill="url(#tkam-warm)"
          opacity={.24 + .1 * (1 + Math.sin(f * .06 + i * 2))}/>)}
      <g fill="none" stroke="#2B3D42" strokeWidth="2.2" opacity=".4">
        {[0, 1, 2, 3].map(i => {const x = (150 + i * 180 + f * 1.6) % 1180 - 50, y = 330 + i * 38 + Math.sin(f * .04 + i) * 9;
          return <path key={i} d={`M${x} ${y}q7 -6 14 0q7 -6 14 0`}/>;})}
      </g>
      <ellipse cx={120 + (f % 300) * 2.9} cy="560" rx="260" ry="520" fill="url(#tkam-warm)" opacity=".28"/>
    </>}

    {scene === 'tkam_porch' && <>
      <g transform={`rotate(${Math.sin(f * .045) * 1.1} 340 1470)`}>
        <image href={art.atticus} x="236" y={1028 + Math.sin(f * .045) * 1.5} width="190" height="409"/>
      </g>
      <image href={art.child} x="646" y={1188 + Math.abs(Math.sin(f * .07)) * 2} width="104" height="208"/>
      <image href={art.boy} x="772" y={1160 + Math.abs(Math.sin(f * .065 + 1)) * 2} width="118" height="236"/>
      {fireflies.map((o, i) => {
        const x = o.x + Math.sin(f * .018 + o.phase) * 34, y = o.y + Math.cos(f * .014 + o.phase) * 26;
        const a = .18 + .55 * (1 + Math.sin(f * .05 + o.phase)) * .5;
        return <g key={i} opacity={a}>
          <circle cx={x} cy={y} r={o.size * 3.4} fill="url(#tkam-warm)"/>
          <circle cx={x} cy={y} r={o.size} fill="#F9E5A2"/>
        </g>;
      })}
      <ellipse cx={540 + Math.sin(f * .012) * 30} cy="520" rx="330" ry="480" fill="url(#tkam-warm)" opacity=".3"/>
    </>}

    {scene === 'tkam_portraits' && <>
      {[[60, 200, 'scout'], [410, 200, 'jem'], [760, 200, 'dill'],
        [60, 600, 'atticus'], [410, 600, 'calpurnia'], [760, 600, 'boo']].map(([x, y, k], i) =>
        <image key={k as string} href={art[k as string]} x={x as number} y={y as number}
          width="260" height="336" opacity={.9 + .08 * (1 + Math.sin(f * .03 + i)) / 2}/>)}
      <image href={art.tom} x="410" y="980" width="260" height="336"/>
      <ellipse cx={70 + (f * 3.1) % 960} cy="800" rx="360" ry="800" fill="url(#tkam-warm)" opacity=".8"/>
      <g opacity=".55">
        {dust.map((o, i) => <circle key={i} cx={o.x + Math.sin(f * .02 + o.phase) * 16}
          cy={o.y + Math.cos(f * .016 + o.phase) * 12} r={o.s} fill="#EFD7A4"
          opacity={.25 + .35 * (1 + Math.sin(f * .04 + o.phase)) / 2}/>)}
      </g>
    </>}

    {scene === 'tkam_boo_house' && <>
      <image href={art.child} x={472 - between(p, .2, .7) * 6} y="1336" width="82" height="164"/>
      <image href={art.boy} x={560 - between(p, .2, .7) * 9} y="1338" width="72" height="144"/>
      <g opacity={between(p, .34, .5) * (1 - between(p, .72, .86))}>
        <ellipse cx="497" cy="716" rx="26" ry="35" fill="#D8CFB4" opacity=".55"/>
        <ellipse cx="490" cy="712" rx="4" ry="3" fill="#3A3830"/>
        <ellipse cx="506" cy="712" rx="4" ry="3" fill="#3A3830"/>
        <path d="M488 738q10 2 18 -2" fill="none" stroke="#6B5C49" strokeWidth="2" opacity=".45"/>
      </g>
      {[0, 1, 2].map(i => <circle key={i} cx={620 + i * 90 + Math.sin(f * .03 + i) * 14} cy={860 + i * 62} r="2.4" fill="#E6D9B0" opacity=".28"/>)}
      <ellipse cx="820" cy="205" rx="110" ry="110" fill="url(#tkam-pale)" opacity=".6"/>
      <ellipse cx="160" cy="1780" rx="420" ry="240" fill="url(#tkam-dark)" opacity=".7"/>
    </>}

    {scene === 'tkam_tree' && <>
      {[
        ['doll', 492, 800, .09, 92], ['doll', 560, 840, .17, 84], ['gum', 466, 900, .23, 72],
        ['pennies', 594, 926, .29, 122], ['watch', 512, 940, .35, 84],
      ].map(([key, x, y, at, w], i) => {
        const q = between(p, at as number, (at as number) + .1), hide = 1 - between(p, .78, .9);
        return <g key={i} opacity={q * hide} transform={`translate(${x} ${y}) scale(${.82 + q * .18})`}>
          <image href={art[key as string]} x={(w as number) / -2} y={key === 'doll' ? -78 : key === 'pennies' ? -30 : key === 'watch' ? -50 : -26}
            width={w as number} height={key === 'doll' ? 158 : key === 'pennies' ? 60 : key === 'watch' ? 100 : 46}/>
        </g>;
      })}
      {[0, 1].map(i => {
        const reach = between(p, .04 + i * .05, .26 + i * .05), away = between(p, .52, .68);
        const y = 1600 - reach * 270 + away * 150, x = 380 + i * 330;
        return <g key={`h${i}`} opacity={.94 * (1 - away)}>
          <rect x={x - 11} y={y} width="22" height="380" rx="11" fill={i ? '#C7B08A' : '#BFA57E'}/>
          <rect x={x - 16} y={y + 250} width="32" height="130" fill="#6D7357"/>
          <ellipse cx={x} cy={y} rx="18" ry="24" fill={i ? '#C7B08A' : '#BFA57E'}/>
          <path d={`M${x - 15} ${y - 13}l-4 -20M${x - 5} ${y - 17}l-1 -22M${x + 6} ${y - 16}l2 -21M${x + 15} ${y - 11}l5 -18`}
            stroke={i ? '#C7B08A' : '#BFA57E'} strokeWidth="6" strokeLinecap="round"/>
        </g>;
      })}
      <g opacity={between(p, .78, .92)}>
        <ellipse cx="540" cy="850" rx={132 * between(p, .78, .9)} ry={182 * between(p, .78, .9)} fill="#8B8575"/>
        <ellipse cx="540" cy="850" rx={116 * between(p, .78, .9)} ry={164 * between(p, .78, .9)} fill="#A29B87"/>
        <path d={`M480 ${810}q60 -20 120 2M482 ${880}q58 14 116 -2`} fill="none" stroke="#6E6A5D" strokeWidth="3" opacity=".45"/>
      </g>
      <ellipse cx="640" cy="1340" rx="210" ry="34" fill="#1A221F" opacity=".22"/>
    </>}

    {scene === 'tkam_court' && <>
      <g clipPath="url(#tkam-judge-clip)">
        <image href={art.judge} x="448" y="470" width="184" height="289"/>
      </g>
      <g transform={`rotate(${-1.5 + between(p, .5, .7) * 4} 540 760)`}>
        <image href={art.atticus} x="466" y="982" width="156" height="335"/>
      </g>
      <g fill="#EBD9AE" opacity=".1">
        <polygon points="140,480 360,480 700,1320 300,1320"/>
        <polygon points="760,480 980,480 1060,1240 760,1240"/>
      </g>
      <g opacity=".55">
        {dust.slice(0, 32).map((o, i) => <circle key={i} cx={o.x + Math.sin(f * .015 + o.phase) * 18}
          cy={o.y + Math.cos(f * .012 + o.phase) * 22} r={o.s * .8} fill="#F0DDAE"
          opacity={.25 + .4 * (1 + Math.sin(f * .03 + o.phase)) / 2}/>)}
      </g>
      <g opacity=".9">
        <rect x="486" y="1160" width="74" height="50" fill="#D9C9A5" transform={`rotate(${Math.sin(f * .04) * 3} 523 1185)`}/>
        <rect x="508" y="1192" width="68" height="46" fill="#E4D5B2" transform={`rotate(${-2 + Math.sin(f * .035) * 2} 542 1215)`}/>
      </g>
      <ellipse cx="540" cy="900" rx="420" ry="520" fill="url(#tkam-warm)" opacity=".2"/>
    </>}

    {scene === 'tkam_trial' && <>
      <image href={art.tom} x="240" y="838" width="190" height="390"/>
      <image href={art.atticus} x="668" y="900" width="174" height="374"/>
      <g opacity={between(p, .2, .45) * (1 - between(p, .88, .96))}>
        <ellipse cx="330" cy="900" rx="120" ry="160" fill="url(#tkam-warm)"/>
      </g>
      <polygon points="110,470 300,470 430,1240 140,1240" fill="#E8D4A7" opacity=".09"/>
      <ellipse cx="330" cy="830" rx="190" ry="250" fill="url(#tkam-warm)" opacity=".4"/>
      <g opacity=".55">
        {dust.slice(0, 20).map((o, i) => <circle key={i} cx={o.x * .4 + 150 + Math.sin(f * .02 + o.phase) * 10}
          cy={600 + (o.y % 500)} r={o.s * .7} fill="#F0DDAE" opacity=".3"/>)}
      </g>
    </>}

    {scene === 'tkam_walk' && <>
      <g transform={`translate(${720 - between(p, .05, .95) * 170} ${1218 + Math.abs(Math.sin(f * .09)) * 4})`}>
        <ellipse cx="100" cy="424" rx="76" ry="16" fill="#101F25" opacity=".5"/>
        <image href={art.atticus} width="190" height="409"/>
        <rect x="-34" y="282" width="86" height="56" rx="6" fill="#3A3328" opacity=".9"/>
        <rect x="-34" y="300" width="86" height="4" fill="#A68A55" opacity=".8"/>
      </g>
      {[[178, 700, .4], [710, 680, .36], [905, 720, .34]].map(([x, y, s], i) =>
        <image key={`w${i}`} href={art.figure} x={x as number} y={(y as number) - 300 * (s as number)}
          width={170 * (s as number)} height={300 * (s as number)} opacity=".38"/>)}
      <g opacity={.4 + .2 * Math.sin(f * .03)} transform={`translate(${930 - between(p, .45, .8) * 40} 430)`}>
        <path d="M58 780L40 330Q36 220 78 210Q122 220 118 330L100 780Z" fill="#0C1820"/>
        <ellipse cx="79" cy="196" rx="44" ry="50" fill="#0C1820"/>
        <path d="M32 188h94" stroke="#0C1820" strokeWidth="16"/>
      </g>
      {fireflies.slice(0, 8).map((o, i) => <circle key={i} cx={760 + Math.sin(f * .02 + o.phase) * 22}
        cy={820 + i * 44} r="2.2" fill="#EFD690" opacity={.2 + .3 * (1 + Math.sin(f * .05 + i)) / 2}/>)}
      <ellipse cx="545" cy="1080" rx="250" ry="620" fill="url(#tkam-warm)" opacity=".22"/>
    </>}

    {scene === 'tkam_night' && <>
      {/* Ewell's shadow keeps to the far right, behind the children. */}
      <g opacity={.5 * (1 - between(p, .62, .76))}
        transform={`translate(${985 - between(p, .1, .45) * 40} 1230) scale(.8) rotate(${-4 + between(p, .1, .4) * 8})`}>
        <path d="M26 420L22 240Q10 190 40 168L86 160Q124 176 132 232L138 420Z" fill="#081018"/>
        <ellipse cx="82" cy="128" rx="46" ry="50" fill="#081018"/>
        <path d="M26 112h108" stroke="#081018" strokeWidth="18"/>
        <path d="M132 200L196 122" stroke="#081018" strokeWidth="20" strokeLinecap="round"/>
        <path d="M196 122l52 -30" stroke="#3A2E22" strokeWidth="11" strokeLinecap="round"/>
      </g>
      <g opacity={between(p, .48, .62)} transform={`translate(${738 - between(p, .48, .75) * 160} ${1268 + Math.sin(f * .03) * 2})`}>
        <image href={art.boo} width="196" height="410"/>
      </g>
      <image href={art.boy} x={596 - between(p, .48, .7) * 10} y="1442" width="108" height="216"
        transform="rotate(8 650 1658)"/>
      <image href={art.ham} x="334" y="1418" width="154" height="214"/>
      <g opacity={between(p, .2, .55)} transform="translate(468 1500)">
        <image href={art.lantern} width="88" height="150"/>
        <ellipse cx="44" cy="70" rx="210" ry="238" fill="url(#tkam-warm)" opacity=".95"/>
      </g>
      <ellipse cx="620" cy="1688" rx="360" ry="54" fill="#08121A" opacity=".4"/>
      <ellipse cx="540" cy="210" rx="250" ry="250" fill="url(#tkam-pale)" opacity=".5"/>
    </>}

    {scene === 'tkam_boo_porch' && <>
      <image href={art.bird} x="246" y="1262" width="86" height="63" opacity={1 - between(p, .3, .5)}/>
      <image href={art.child} x="458" y={1352 + Math.sin(f * .02) * 2} width="116" height="232"/>
      <g opacity={1 - between(p, .48, .75)} transform={`translate(${between(p, .45, .8) * 100} ${1300 + Math.sin(f * .02) * 2})`}>
        <image href={art.boo} width="194" height="406"/>
      </g>
      <ellipse cx="540" cy="1480" rx="560" ry="90" fill="url(#tkam-warm)" opacity={between(p, .1, .85) * .5}/>
      {[0, 1].map(i =>
        <circle key={i} cx={[300, 760][i]} cy={[1165, 1145][i]} r={30 - between(p, .45 + i * .12, .6 + i * .12) * 27}
          fill="#121F26" opacity={between(p, .45 + i * .12, .6 + i * .12) * .85}/>)}
      <g opacity=".3">
        {[0, 1, 2].map(i => <path key={i} d={`M${820 + i * 22} 700q${Math.sin(f * .02 + i) * 18} 140 ${Math.sin(f * .02 + i) * 10} 300`}
          fill="none" stroke="#2C413E" strokeWidth="7"/>)}
      </g>
    </>}

    {scene === 'tkam_mockingbird' && <>
      <image href={art.bird} x={476 + Math.sin(f * .03) * 2} y={828 + Math.sin(f * .04) * 2} width="260" height="190"
        transform={`rotate(${Math.sin(f * .05) * 1.2} 606 923)`}/>
      {[0, 1, 2].map(i => {
        const q = between(p, .18 + i * .16, .92);
        const x = 600 + i * 54 + Math.sin(q * 5 + i) * 44, y = 1010 + q * 650;
        return <g key={`f${i}`} opacity={q > 0 && q < 1 ? .85 : 0}
          transform={`translate(${x} ${y}) rotate(${q * 180 + i * 40}) scale(.45)`}>
          <image href={art.feather} width="80" height="180"/>
        </g>;
      })}
      <g opacity={between(p, .5, .7) * (1 - between(p, .82, .95))} transform={`translate(${260 + (p - .5) * 1300} ${430 - (p - .5) * 200})`}>
        <path d="M0 20q32 -20 62 2q-30 10 -62 -2Z" fill="#132A34"/>
        <path d="M24 22q-22 14 -44 8q18 -4 44 -8Z" fill="#132A34"/>
      </g>
      <ellipse cx="800" cy="250" rx="240" ry="240" fill="url(#tkam-pale)" opacity=".4"/>
    </>}

    {scene === 'tkam_reading' && <>
      <g stroke="#9DB6BD" strokeLinecap="round" opacity=".5">
        {rain.map((r, i) => {const y = 250 + ((r.y - 250 + f * r.sp) % 740);
          return <path key={i} d={`M${r.x} ${y}l-5 ${r.len}`} strokeWidth={i % 3 ? 1.4 : 2.2} opacity={r.a}/>;})}
      </g>
      <ellipse cx="500" cy="1428" rx="300" ry="36" fill="#17120D" opacity=".45"/>
      <image href={art.book} x="196" y="1082" width="640" height="368"/>
      <g transform="translate(514 1098)" opacity=".95">
        <image href={art.page} x="0" y="0" width="300" height="326"
          transform={`scale(${Math.max(0.02, Math.cos(Math.min(Math.PI, (f % 300) / 300 * Math.PI)))} 1)`}/>
      </g>
      <image href={art.mug} x="86" y="1352" width="90" height="106"/>
      <g fill="none" stroke="#D9CBAA" strokeWidth="3" opacity=".22">
        {[0, 1, 2].map(i => <path key={i} d={`M${114 + i * 9} 1348q${Math.sin(f * .03 + i) * 14} -40 ${Math.sin(f * .03 + i) * 4} -80`}/>)}
      </g>
      <ellipse cx="936" cy="1130" rx="220" ry="300" fill="url(#tkam-warm)" opacity=".55"/>
      <g opacity=".45">
        {dust.slice(0, 20).map((o, i) => <circle key={i} cx={o.x % 520 + 260 + Math.sin(f * .01 + o.phase) * 12}
          cy={900 + (o.y % 380)} r={o.s * .7} fill="#F2D9A5" opacity=".3"/>)}
      </g>
    </>}
  </g>;
};
