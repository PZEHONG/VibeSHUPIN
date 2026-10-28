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
const SUB_Y = 1500;      // 字幕块中心；参考片中文主行约 76–78%H，英文副行约 81–84%H
const SUB_SIZE = 68;     // 参考片主行约占画面高 3.1–4.8%；9:16 取 54/62/68 三档，一行 ≤14 字

function subBackdrop(fr) {
  const g = fr.grad(0, 1400, 0, H, [[0, '#010104', 0], [.26, '#010104', .16], [1, '#010104', .62]]);
  fr.rect(0, 1400, W, H - 1400, { fill: g });
}
function grade(fr) {
  // 电影静帧的轻微暗角；只压边缘，不碰角色与字幕。
  if (STYLE.look.vignette) {
    fr.rect(0, 0, W, H, {
      fill: fr.rgrad(W / 2, H * .46, W * .32, W * .78,
        [[0, '#000', 0], [.72, '#000', 0], [1, '#000', STYLE.look.vignette]])
    });
  }
}
function drawSubs(fr, t) {
  for (const s of SUBS) {
    if (t < s.a || t > s.b) continue;
    const k = Math.min(ss(t, s.a, s.a + .26), 1 - ss(t, s.b - .2, s.b));
    if (k <= .002) continue;
    const lines = s.zh.split(/\r?\n|\\n/);
    const maxLen = Math.max(...lines.map(l => K.parseMark(l).length));
    const size = maxLen > 16 ? 54 : maxLen > 13 ? 62 : SUB_SIZE, lh = size * 1.38;
    const hasEn = !!s.en;
    const y0 = SUB_Y - (hasEn ? 34 : 0) - (lines.length - 1) * lh / 2;
    lines.forEach((line, i) => {
      const chars = K.parseMark(line);
      fr.chars(chars.map(c => c.ch).join(''), W / 2, y0 + i * lh, {
        font: STYLE.subtitle_font, size, track: size * .055, color: SUB, a: k,
        shadow: .88, shadowBlur: 20, shadowY: 3
      }, idx => chars[idx].tone ? { color: chars[idx].tone === 'red' ? ROSE : GOLD } : null);
    });
    if (hasEn) {
      fr.text(s.en, W / 2, y0 + (lines.length - 1) * lh + 92, {
        font: 'latin', size: 27, track: 1.2, color: SUB, a: k * .82,
        shadow: .8, shadowBlur: 14, shadowY: 2, stroke: '#000', strokeW: 2
      });
    }
  }
}
function drawTitleCard(fr, t) {
  const c = ART.title_card;
  if (!c) return;
  const k = Math.min(ss(t, c.start, c.start + .45), 1 - ss(t, c.end - .45, c.end));
  if (k <= .002) return;
  fr.rect(0, 140, W, 430, {
    fill: fr.grad(0, 140, 0, 570, [[0, '#050505', .58], [.62, '#050505', .22], [1, '#050505', 0]])
  });
  if (c.kicker) {
    fr.text(c.kicker, W / 2, 292, {
      font: 'serifr', size: 27, track: 7, color: GOLD, a: k * .95,
      shadow: .8, shadowBlur: 16, shadowY: 2
    });
  }
  const title = c.title || ART.title || '';
  fr.text(title, W / 2, 388, {
    font: 'serifh', size: title.length > 8 ? 58 : 70, track: 6,
    color: '#F6EFE2', a: k, shadow: .88, shadowBlur: 26, shadowY: 4
  });
  if (c.author) {
    fr.text(c.author, W / 2, 462, {
      font: 'serifr', size: 28, track: 2, color: GOLD, a: k * .9,
      shadow: .75, shadowBlur: 14, shadowY: 2
    });
  }
}
function drawClosing(fr, t) {
  const c = ART.closing;
  if (!c) return;
  if (SUBS.some(s => t >= s.a && t <= s.b)) return;   // 有字幕时不抢位置
  const k = Math.min(ss(t, c.start, c.start + .5), 1 - ss(t, c.end - .5, c.end));
  if (k <= .002) return;
  fr.text(c.text, W / 2, 930, {
    font: 'serifh', size: 52, track: 4, color: '#F6EFE2', a: k,
    shadow: .9, shadowBlur: 26, shadowY: 4
  });
  if (c.attribution) {
    fr.text(c.attribution, W / 2, 1030, {
      font: 'serifr', size: 28, track: 2, color: GOLD, a: k * .9,
      shadow: .75, shadowBlur: 14, shadowY: 2
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
      grade(fr);
      drawTitleCard(fr, t);
      drawClosing(fr, t);
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
