/* AI分镜图片：先加载完成，再启动 VK.film；所有运动只由 t 决定。 */
(function (G) {
'use strict';
function load(shots) {
  return Promise.all(shots.map(shot => new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => reject(new Error('素材加载超时：' + shot.image)), 30000);
    image.onload = () => { clearTimeout(timer); resolve([shot.id, image]); };
    image.onerror = () => { clearTimeout(timer); reject(new Error('素材缺失或无法解码：' + shot.image)); };
    image.src = shot.image.split('/').map(encodeURIComponent).join('/');
  }))).then(entries => new Map(entries));
}
function draw(fr, t, shots, images) {
  const { W, H, clamp, smooth } = G.VK;
  let shot = shots[0];
  for (const candidate of shots) {
    if (candidate.start <= t) shot = candidate;
    else break;
  }
  const image = images.get(shot.id);
  const motion = shot.motion || { type: 'none', amount: 0 };
  const k = smooth(clamp((t - shot.start) / (shot.end - shot.start)));
  const amount = motion.amount || 0;
  let scale = 1, dx = 0;
  if (motion.type === 'push') scale += amount * k;
  if (motion.type === 'pull') scale += amount * (1 - k);
  if (motion.type === 'pan-left' || motion.type === 'pan-right') {
    scale += amount * 2;
    dx = (motion.type === 'pan-left' ? -1 : 1) * amount * W * (k * 2 - 1);
  }
  const ratio = Math.max(W / image.naturalWidth, H / image.naturalHeight) * scale;
  const width = image.naturalWidth * ratio, height = image.naturalHeight * ratio;
  fr.look.under = ctx => {
    ctx.save();
    ctx.drawImage(image, (W - width) / 2 + dx, (H - height) / 2, width, height);
    ctx.restore();
  };
}
G.VKArt = { load, draw };
})(window);
