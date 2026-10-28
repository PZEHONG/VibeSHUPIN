/** Slow spatial moves inspired by the reference; no wall clock or mutable state. */
export const oilCamera = (scene: string, progress: number) => {
  const p = Math.max(0, Math.min(1, progress));
  const t = scene === 'empty_table' ? Math.min(1, p/.78) : p;
  const u = t*t*(3-2*t);
  const pull = scene === 'rain' || scene === 'empty_table' || scene === 'tkam_boo_porch';
  const scale = pull ? 1.11-u*.055 : 1.055+u*(scene === 'market' ? .075 : .045);
  const direction = scene === 'portraits' || scene === 'tkam_portraits' ? -1
    : scene === 'city' || scene === 'tkam_walk' ? 1 : 0;
  return {scale, x: direction*(u-.5)*24, y: (u-.5)*(scene==='market' ? 32 : 12)};
};

/** Independent painted planes; smooth and reproducible at arbitrary frames. */
export const rainDepth = (progress: number) => {
  const p = Math.max(0, Math.min(1, progress));
  const u = p*p*(3-2*p);
  return {shore: {x: -8*u, y: -3*u}, figure: {x: 8*u, y: 3*u},
    near: {x: -32*u, y: 12*u}};
};

/** View-dependent projection of the depth of each house, in scene coordinates. */
export const houseProjection = (index: number, progress: number) => {
  const p = Math.max(0, Math.min(1, progress));
  const u = p*p*(3-2*p);
  const depth = [0.9, 1, 0.82, 0.72][index] ?? 1;
  return {frontX: -(3+depth*8)*u, frontY: -3*u,
    sideWidth: 42*depth + 11*u*depth, roofRise: 22*depth};
};
