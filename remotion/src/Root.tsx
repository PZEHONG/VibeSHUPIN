import React from 'react';
import {Composition} from 'remotion';
import {BookReview} from './BookReview';
import {demoMotion, totalFrames, type FilmProps} from './data/types';

export const Root: React.FC = () => <Composition
  id="BookReview" component={BookReview} width={1080} height={1920} fps={30}
  durationInFrames={120} defaultProps={{motion: demoMotion, fontBase: 'fonts'} satisfies FilmProps}
  calculateMetadata={({props}) => ({durationInFrames: totalFrames(props.motion.duration, props.motion.fps),
    width: props.motion.width, height: props.motion.height, fps: props.motion.fps})}
/>;
