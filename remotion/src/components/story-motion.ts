const ease = (v: number) => {const x = Math.max(0, Math.min(1, v)); return x*x*(3-2*x);};
const windowed = (p: number, a: number, b: number) => ease((p-a)/(b-a));
export const treeState = (p: number) => ({
  reach: windowed(p,.08,.26)*(1-windowed(p,.55,.70)),
  gifts: windowed(p,.20,.48),
  seal: windowed(p,.68,.82),
});
export const courtState = (p: number) => ({speaker: windowed(p,.12,.32), evidence: windowed(p,.70,.90)});

export const giftProgress = (p: number, index: number) => windowed(p, .20 + index * .035, .25 + index * .035);
