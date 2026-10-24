/* 9:16 AI绘画书评 · 只有温暖男声旁白，无配乐无音效。
 * 画风、镜头和图片来自 art-direction.json，经 prepare_art.py 同步为 art-direction.js。
 * 原著事实与示意边界见 storyboard.md；动词的真实动作可按分镜扩展 scene1。 */
(function () {
'use strict';
const { W, H, ss } = VK;
const K = VKit, ART = window.ART_DIRECTION, STYLE = ART.style, P = STYLE.palette;
const INK = P.ink, SUB = P.sub, GOLD = P.gold, ROSE = P.rose, MUTE = P.mute;
const DUR = __DURATION__; // = audio/timings.json 的 duration
const SUBS = __SUBS__;
const SUB_Y = 1520;

function subBackdrop(fr) {
  const g = fr.grad(0, 1400, 0, H, [[0, '#010104', 0], [.26, '#010104', .40], [1, '#010104', .88]]);
  fr.rect(0, 1400, W, H - 1400, { fill: g });
}
function drawSubs(fr, t) {
  for (const s of SUBS) {
    if (t < s.a || t > s.b) continue;
    const k = Math.min(ss(t, s.a, s.a + .26), 1 - ss(t, s.b - .2, s.b));
    if (k <= .002) continue;
    const lines = s.zh.split(/\r?\n|\\n/);
    const size = lines.some(l => K.parseMark(l).length > 16) ? 42 : 46, lh = size * 1.42;
    const y0 = SUB_Y - (lines.length - 1) * lh / 2;
    lines.forEach((line, i) => {
      const chars = K.parseMark(line);
      fr.chars(chars.map(c => c.ch).join(''), W / 2, y0 + i * lh, {
        font: STYLE.subtitle_font, size, track: size * .055, color: SUB, a: k,
        shadow: .85, shadowBlur: 18, shadowY: 3
      }, idx => chars[idx].tone ? { color: chars[idx].tone === 'red' ? ROSE : GOLD } : null);
    });
  }
}
function scene1(fr, t) {
  // 在这里按分镜实现必要动作；镜头推拉不替代旁白要求的具体动作。
}
window.READY = false;
VKArt.load(ART.shots).then(images => {
  VK.film({
    dur: DUR, fps: 30, theme: STYLE.theme,
    meta: { title: ART.title, visual_style: STYLE.id },
    draw(fr, t) {
      fr.look.bgo = { color: P.background };
      fr.look.bloom = STYLE.look.bloom;
      fr.look.grain = STYLE.look.grain;
      VKArt.draw(fr, t, ART.shots, images);
      scene1(fr, t);
      subBackdrop(fr);
      drawSubs(fr, t);
    }
  });
}).catch(error => {
  window.LOAD_ERROR = error.message;
  console.error(error);
  const ctx = document.getElementById('stage').getContext('2d');
  ctx.fillStyle = '#202E3C'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#EDE8DE'; ctx.font = '28px sans-serif';
  ctx.fillText(error.message, 60, 200, W - 120);
});
})();
