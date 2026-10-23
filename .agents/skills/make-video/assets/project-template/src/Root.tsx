import React from 'react';
import {CalculateMetadataFunction, Composition, Still} from 'remotion';
import {Film} from './Film';
import {Cover} from './Cover';
import {COVER_PRESETS, VIDEO_PRESETS} from './presets';
import {contentSchema, defaultContent, type Content} from './content';
import {DURATION_IN_FRAMES, FPS} from './config';

// 时长由 props.durationInSeconds 决定（默认 60 秒 = 1800 帧）。
const calculateMetadata: CalculateMetadataFunction<Content> = ({props}) => ({durationInFrames: Math.round(props.durationInSeconds * FPS)});

export const RemotionRoot: React.FC = () => (
  <>
    {Object.values(VIDEO_PRESETS).map((preset) => <Composition key={preset.id} {...preset} component={Film} schema={contentSchema} defaultProps={defaultContent} calculateMetadata={calculateMetadata} durationInFrames={DURATION_IN_FRAMES} fps={FPS}/>)}
    {COVER_PRESETS.map(({id, width, height}) => <Still key={id} id={id} width={width} height={height} component={Cover} schema={contentSchema} defaultProps={defaultContent}/>)}
  </>
);
