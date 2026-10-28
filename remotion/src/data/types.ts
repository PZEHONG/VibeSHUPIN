export const oilFullScenes = ['market', 'portraits', 'table', 'city', 'quarrel', 'book', 'empty_table'] as const;
export type OilFullSceneType = typeof oilFullScenes[number];
export const tkamScenes = ['tkam_town', 'tkam_porch', 'tkam_portraits', 'tkam_boo_house',
  'tkam_tree', 'tkam_court', 'tkam_trial', 'tkam_walk', 'tkam_night', 'tkam_boo_porch',
  'tkam_mockingbird', 'tkam_reading'] as const;
export type TKAMSceneType = typeof tkamScenes[number];
export type Subtitle = {start: number; end: number; zh: string; en?: string};
export type Shot = {
  id: string; start: number; end: number;
  scene_type: 'story_discovery' | 'story_tree' | 'story_court' | 'media' | 'corridor' | 'goldfish' | 'rain' | 'mock_evidence' | 'mock_defense' | 'mock_crowd' | 'mock_court' | 'mock_gallery' | 'mock_voice' | OilFullSceneType | TKAMSceneType;
  scene_props: {cycles?: number; stop_at?: number; layers?: {src: string; type: 'image' | 'video'; scaleFrom?: number; scaleTo?: number; xFrom?: number; xTo?: number; opacity?: number}[]};
  segment_ids: string[]; kind: string; evidence: string; intent: string;
};
export type Motion = {
  schema_version: number; renderer: 'remotion'; theme: 'M01' | 'M02' | 'CUSTOM'; draft: boolean;
  title: string; author: string; width: number; height: number; fps: number; duration: number;
  source_hashes: Record<string, string>; shots: Shot[]; subtitles: Subtitle[];
  title_card: {start: number; end: number; text: string} | null;
  closing: {start: number; end: number; text: string} | null;
};
export type FilmProps = {motion: Motion; fontBase: string; assetBase?: string; audit?: boolean};
export const frameAt = (seconds: number, fps: number) => Math.floor(seconds * fps + .5);
export const totalFrames = (seconds: number, fps: number) => Math.ceil(seconds * fps - 1e-8);
export const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const smooth = (n: number) => {const x = clamp(n); return x * x * (3 - 2 * x);};
export const between = (n: number, a: number, b: number) => smooth((n - a) / (b - a));

export const demoMotion: Motion = {
  schema_version: 1, renderer: 'remotion', theme: 'M01', draft: false,
  title: '百年孤独', author: '加夫列尔·加西亚·马尔克斯',
  width: 1080, height: 1920, fps: 30, duration: 4,
  source_hashes: {},
  shots: [{id: 'demo', start: 0, end: 4, scene_type: 'goldfish', scene_props: {cycles: 1},
    segment_ids: [], kind: '原著场景', evidence: '金鱼重铸', intent: '反复重做'}],
  subtitles: [{start: .1, end: 3.8, zh: '上校做完金鱼，熔掉，再重做。'}], title_card: null, closing: null,
};
