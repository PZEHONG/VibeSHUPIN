import React, {useEffect, useLayoutEffect, useState} from 'react';
import {Img, OffthreadVideo, Sequence, AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Paper} from './components/Paper';
import {Subtitles} from './components/Subtitles';
import {Corridor} from './scenes/Corridor';
import {Goldfish} from './scenes/Goldfish';
import {Rain} from './scenes/Rain';
import {DiscoveryScene} from './scenes/DiscoveryScene';
import {StoryScene} from './scenes/StoryScene';
import {MockingbirdScene} from './scenes/MockingbirdScene';
import {between, clamp, frameAt, totalFrames, type FilmProps} from './data/types';
import {paper} from './themes/literary';
import {oil} from './themes/oil';
import {OilScene, OilSurface} from './scenes/OilScene';

export const BookReview: React.FC<FilmProps> = ({motion, fontBase, assetBase, audit}) => {
  const isOil = motion.theme === 'M02', isCustom = motion.theme === 'CUSTOM', P = isOil ? oil : paper;
  const Surface = isOil ? OilSurface : Paper;
  const frame = useCurrentFrame(), {fps} = useVideoConfig();
  const [handle] = useState(() => delayRender('Loading local book-review fonts'));
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    const fonts = [
      new FontFace('VibeSerif', `url("${staticFile(`${fontBase}/NotoSerifSC-VF.ttf`)}")`, {weight: '200 900'}),
      new FontFace('VibeLatin', `url("${staticFile(`${fontBase}/CormorantGaramond.ttf`)}")`),
    ];
    if (isOil || isCustom) fonts.push(new FontFace('VibeHuimo',
      `url("${staticFile(`${fontBase}/WenYue-HuiMoShouShu-J.otf`)}")`, {weight: '400'}));
    Promise.all(fonts.map(async font => {const loaded = await font.load(); document.fonts.add(loaded);}))
      .then(() => {if (!disposed) setFontsReady(true);})
      .catch(error => cancelRender(error));
    return () => {disposed = true;};
  }, [fontBase, handle, isOil, isCustom]);
  useLayoutEffect(() => {
    if (!fontsReady) return;
    if (audit) {
      const bounds = Array.from(document.querySelectorAll('[data-subtitle-zh], [data-subtitle-en]')).map(el => {
        const r = el.getBoundingClientRect();
        return {kind: el.hasAttribute('data-subtitle-zh') ? 'zh' : 'en', top: r.top, bottom: r.bottom,
          left: r.left, right: r.right, width: r.width, scrollWidth: el.scrollWidth,
          fontFamily: getComputedStyle(el).fontFamily};
      });
      console.log('[vibe-geometry]' + JSON.stringify({frame, bounds}));
    }
    continueRender(handle);
  }, [fontsReady, audit, frame, handle]);
  const last = motion.shots.length - 1;
  const index = motion.shots.findIndex((s, i) => frame >= frameAt(s.start, fps) &&
    frame < (i === last ? totalFrames(motion.duration, fps) : frameAt(s.end, fps)));
  const shot = motion.shots[index];
  if (!shot) throw new Error(`No scene covers frame ${frame}`);
  const from = frameAt(shot.start, fps), to = index === last ? totalFrames(motion.duration, fps) : frameAt(shot.end, fps);
  const local = frame - from;
  const progress = clamp(local / Math.max(1, to - from - 1));
  // A short paper wash within the fixed interval masks a scene cut without changing duration.
  const sceneOpacity = !isOil && index > 0 ? between(local, 0, 7) : 1;
  const card = motion.title_card;
  const closing = motion.closing;
  return <AbsoluteFill style={{fontFamily: 'VibeSerif', background: P.bg}}>
    {shot.scene_type === 'story_discovery' ? <DiscoveryScene seconds={local / fps}/> : shot.scene_type.startsWith('story_') ? <StoryScene kind={shot.scene_type} progress={progress} frame={local}/> : shot.scene_type === 'media' ? <Sequence from={from} durationInFrames={to - from}><AbsoluteFill style={{overflow: 'hidden', background: '#171b1b'}}>{shot.scene_props.layers?.map((layer, i) => {
      const scale = (layer.scaleFrom ?? 1.04) + ((layer.scaleTo ?? 1.12) - (layer.scaleFrom ?? 1.04)) * progress;
      const x = (layer.xFrom ?? 0) + ((layer.xTo ?? 0) - (layer.xFrom ?? 0)) * progress;
      const style: React.CSSProperties = {position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `translateX(${x}px) scale(${scale})`, opacity: layer.opacity ?? 1};
      const src = staticFile(`${assetBase}/${layer.src}`);
      return layer.type === 'video' ? <OffthreadVideo key={i} src={src} muted style={style}/> : <Img key={i} src={src} style={style}/>;
    })}</AbsoluteFill></Sequence> : <Surface>
      {!isOil && <>
        <path d="M84 211H996" stroke={P.line} strokeWidth="1"/>
        <text x="84" y="142" fill={P.ink} fontSize="31" letterSpacing="5">{motion.title}</text>
        <text x="84" y="184" fill={P.muted} fontSize="19" letterSpacing="2">{motion.author}</text>
        <path d="M969 114v58m-7-50h14m-14 12h14m-14 12h14m-14 12h14" stroke={P.gold} opacity=".65"/>
      </>}
      <g opacity={sceneOpacity}>
        {isOil ? <OilScene shot={shot} progress={progress} localFrame={local}/> : <>
          {shot.scene_type === 'corridor' && <Corridor progress={progress} cycles={shot.scene_props.cycles!}/>}
          {shot.scene_type === 'goldfish' && <Goldfish progress={progress} cycles={shot.scene_props.cycles!}/>}
          {shot.scene_type === 'rain' && <Rain progress={progress} stopAt={shot.scene_props.stop_at!} localFrame={local}/>}
          {shot.scene_type.startsWith('mock_') && <MockingbirdScene type={shot.scene_type} progress={progress}/>}
        </>}
      </g>
      {!isOil && card && frame >= frameAt(card.start, fps) && frame < frameAt(card.end, fps) && <g>
        <rect x="78" y="238" width="924" height="225" fill={P.bg}/>
        <text x="540" y="370" fontSize="75" textAnchor="middle" fill={P.ink}>{card.text}</text>
      </g>}
      {!isOil && closing && frame >= frameAt(closing.start, fps) && frame < frameAt(closing.end, fps) &&
        <text x="540" y="1330" textAnchor="middle" fontSize="35" fill={P.ink}>{closing.text}</text>}
    </Surface>}
    <Subtitles subtitles={motion.subtitles} theme={isCustom ? 'M02' : motion.theme}/>
  </AbsoluteFill>;
};
