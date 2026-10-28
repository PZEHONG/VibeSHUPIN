import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {frameAt, clamp, smooth, type Motion, type Subtitle} from '../data/types';
import {paper} from '../themes/literary';
import {oil} from '../themes/oil';

const visible = (s: string) => s.replace(/\{!?([^{}]+)\}/g, '$1');
const fit = (lines: string[], base: number, family: string, tracking: number, proportional: boolean) => {
  const context = document.createElement('canvas').getContext('2d')!;
  context.font = `${family === 'VibeSerif' ? 500 : 400} ${base}px ${family}`;
  const width = Math.max(...lines.map(line => context.measureText(visible(line)).width +
    visible(line).length * (proportional ? base * tracking : tracking)));
  // Reserve a few pixels for glyph overhang and fractional letter spacing.
  const scale = Math.min(1, 948 / Math.max(1, width));
  return {size: Math.floor(base * scale * 100) / 100,
    tracking: proportional ? undefined : tracking * scale, width: width * scale};
};
const marked = (line: string, P: typeof paper) => line.split(/(\{!?[^{}]+\})/).filter(Boolean).map((part, i) =>
  /^\{/.test(part) ? <span key={i} style={{color: part.startsWith('{!') ? P.rose : P.gold}}>{part.replace(/^\{!?|\}$/g, '')}</span> : part);

export const Subtitles: React.FC<{subtitles: Subtitle[]; theme?: Motion['theme']}> = ({subtitles, theme = 'M01'}) => {
  const isOil = theme === 'M02', P = isOil ? oil : paper;
  const frame = useCurrentFrame(), {fps} = useVideoConfig();
  const sub = subtitles.find(s => frame >= frameAt(s.start, fps) && frame < frameAt(s.end, fps));
  if (!sub) return null;
  const start = frameAt(sub.start, fps), end = frameAt(sub.end, fps);
  // Brief eased fades, bounded by cue length, keep even short spoken cues readable.
  const fade = Math.max(1, Math.min(Math.round(fps * .16), Math.floor((end - start) / 4)));
  const opacity = isOil
    ? Math.min(smooth((frame - start + 1) / fade), smooth((end - frame) / fade))
    : Math.min(clamp((frame - start) / 7.8), clamp((end - frame) / 6));
  const lines = sub.zh.split('\n');
  const count = Math.max(...lines.map(s => visible(s).length));
  const base = isOil ? (count > 16 ? 60 : count > 13 ? 66 : 72) : (count > 16 ? 54 : count > 13 ? 62 : 68);
  const family = isOil ? 'VibeHuimo' : 'VibeSerif';
  const tracking = isOil ? .018 : .055;
  const chinese = fit(lines, base, family, tracking, true);
  const size = chinese.size;
  const english = sub.en ? fit([sub.en], 27, 'VibeLatin', 1.2, false) : null;
  const height = size * (isOil ? 1.28 : 1.38);
  // Actual CSS line boxes, rather than a canvas baseline estimate, fit below 1594.
  const top = 1500 - (lines.length * height) / 2 - (sub.en ? 34 : 0);
  const blockHeight = lines.length * height + (sub.en ? 50 : 0);
  const scrimWidth = Math.min(1080, Math.max(chinese.width, english?.width ?? 0) + 180);
  return <div style={{position: 'absolute', inset: 0, opacity}}>
    <div style={isOil ? {position: 'absolute', left: (1080 - scrimWidth) / 2, width: scrimWidth,
      top: top - 52, height: blockHeight + 104,
      background: 'radial-gradient(ellipse at center, rgba(12,20,18,.48), rgba(12,20,18,.28) 48%, transparent 74%)'}
      : {position: 'absolute', left: 62, right: 62, top: 1396, height: 210,
        background: 'linear-gradient(180deg, transparent, rgba(244,237,222,.92) 40%, rgba(244,237,222,.96))'}}/>
    <div data-subtitle-zh style={{position: 'absolute', left: 64, right: 64, top,
      fontFamily: family, fontSize: size, lineHeight: `${height}px`, letterSpacing: `${tracking}em`,
      fontWeight: isOil ? 400 : 500, fontSynthesis: isOil ? 'none' : undefined,
      textAlign: 'center', color: P.ink, whiteSpace: 'pre',
      textShadow: isOil ? '0 2px 3px rgba(9,15,14,.9), 0 0 10px rgba(9,15,14,.65)' : '0 1px 0 #fff9'}}>
      {lines.map((line, i) => <div key={i}>{marked(line, P)}</div>)}
    </div>
    {sub.en ? <div data-subtitle-en style={{position: 'absolute', left: 64, right: 64,
      top: top + height + 16, fontFamily: 'VibeLatin', fontSize: english!.size, lineHeight: '34px',
      letterSpacing: english!.tracking, color: P.muted, textAlign: 'center', whiteSpace: 'nowrap'}}>{sub.en}</div> : null}
  </div>;
};
