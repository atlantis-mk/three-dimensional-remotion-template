// 视频方向与封面交付相互独立。默认尺寸集中在这里。
export const VIDEO_PRESETS = {
  landscape: {id: 'Main', width: 1920, height: 1080},
  portrait: {id: 'MainVertical', width: 1080, height: 1920},
} as const;

export const COVER_PRESETS = [
  {id: 'Cover4x3', width: 1600, height: 1200, filename: 'cover-4x3.png'},
  {id: 'Cover3x4', width: 1200, height: 1600, filename: 'cover-3x4.png'},
  {id: 'Cover16x9', width: 1920, height: 1080, filename: 'cover-16x9.png'},
] as const;
