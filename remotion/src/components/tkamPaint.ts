/** Painted plates and props for the 1930s Maycomb film.
 * Every mark is generated once with a fixed seed; frames only move finished paint.
 */
import {daub, glaze, makePaint, pigment, polygon, random, rectangle} from './oilPaint';

type Ctx = CanvasRenderingContext2D;
export type TKAMScene =
  | 'tkam_town' | 'tkam_porch' | 'tkam_portraits' | 'tkam_boo_house'
  | 'tkam_tree' | 'tkam_court' | 'tkam_trial' | 'tkam_walk'
  | 'tkam_night' | 'tkam_boo_porch' | 'tkam_mockingbird' | 'tkam_reading';

const earth = ['#6A5A3F', '#9A7C52', '#B99A67', '#3C4B49'];
const wood = ['#6B4B32', '#8E6540', '#B08A57', '#3D3B31'];
const cream = ['#B7A57F', '#D6C39A', '#8E8767', '#E4D2AA'];
const dark = ['#142B3C', '#2B4A58', '#3E6065', '#0E1F2E'];
const warm = ['#C08A45', '#E0B160', '#F0CE8B', '#8B6436'];
const green = ['#223C40', '#3E5D52', '#6F7C5D', '#1A3036'];

const ground = (c: Ctx, colors: string[], seed: number, count = 3600) =>
  pigment(c, rectangle(0, 0, 1080, 1920), [0, 0, 1080, 1920], colors, seed, count, -.08, 1.7);
const beam = (c: Ctx, x: number, y: number, w: number, h: number, seed: number, colors = wood) =>
  pigment(c, rectangle(x, y, w, h), [x, y, w, h], colors, seed, h > w ? 230 : 180, h > w ? -1.5 : 0, .7);
const oval = (x: number, y: number, rx: number, ry: number) => {
  const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return p;
};
const line = (c: Ctx, x1: number, y1: number, x2: number, y2: number, width: number, color: string) => {
  c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
};

/** A cluster of overlapping painted leaves, used to build a full crown. */
const leafMass = (c: Ctx, cx: number, cy: number, rx: number, ry: number, seed: number, light = false) => {
  const r = random(seed);
  const colors = light
    ? ['#35503F', '#466149', '#5A6E4D', '#6F7A50']
    : ['#172E30', '#223D36', '#30493A', '#3B5540'];
  pigment(c, oval(cx, cy, rx, ry), [cx - rx, cy - ry, rx * 2, ry * 2], colors, seed, 300, 0, 1.8);
  for (let i = 0; i < 90; i++) {
    const a = r() * 6.283, rr = Math.sqrt(r());
    daub(c, cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr,
      7 + r() * 22, 2 + r() * 5, a + (r() - .5) * 1.3, i % 4 ? colors[2] : '#7E8757', r);
  }
  for (let i = 0; i < 34; i++) {
    const a = r() * 6.283;
    daub(c, cx + Math.cos(a) * rx * (.96 + r() * .13), cy + Math.sin(a) * ry * (.96 + r() * .13),
      6 + r() * 15, 1.6 + r() * 2.4, a, i % 3 ? '#3E5942' : '#778055', r);
  }
};

/** Oak limbs plus clustered leaf masses; never a single vertical brush pile. */
const oak = (c: Ctx, x: number, y: number, w: number, h: number, seed: number) => {
  const crownX = x + w * .5, crownY = y + h * .33;
  // Trunk with flared roots and a tapered waist.
  pigment(c, polygon([[x + w * .32, y + h], [x + w * .39, y + h * .8], [x + w * .41, y + h * .46],
    [x + w * .455, y + h * .2], [x + w * .55, y + h * .2], [x + w * .59, y + h * .46],
    [x + w * .61, y + h * .8], [x + w * .68, y + h]]),
    [x + w * .3, y + h * .2, w * .4, h * .8],
    ['#3A3226', '#564634', '#2A2B24'], seed, 700, -1.5, .7);
  // Bark scored across the trunk, not hanging in long pale ribbons.
  c.globalAlpha = .42;
  for (let i = 0; i < 46; i++) {
    const rr = random(seed + 400 + i);
    const yy = y + h * (.28 + rr() * .7);
    daub(c, crownX + (rr() - .5) * w * .17, yy, 9 + rr() * 22, 2 + rr() * 3,
      -.05 + (rr() - .5) * .2, i % 3 ? '#241F18' : '#7B5F40', rr);
  }
  c.globalAlpha = 1;
  // Heavy limbs leave the trunk and disappear into the crown.
  const limbs = [[-.34, .03, -.44, .05], [-.2, -.01, -.27, -.04], [.32, .02, .42, .03],
    [.18, -.02, .25, -.07], [-.05, -.03, -.06, -.1], [.1, .06, .16, .12]];
  for (let i = 0; i < limbs.length; i++) {
    const [sx, sy, ex, ey] = limbs[i];
    c.strokeStyle = 'rgba(58,47,34,.9)'; c.lineWidth = 15 - i; c.lineCap = 'round';
    c.beginPath(); c.moveTo(crownX + w * sx * .55, crownY + h * .22 + h * sy);
    c.quadraticCurveTo(crownX + w * sx, crownY + h * (sy - .14),
      crownX + w * ex, crownY + h * ey); c.stroke();
  }
  // Broad horizontal core masses give the oak a spreading crown, not a cypress spire.
  leafMass(c, crownX - w * .22, crownY + h * .015, w * .34, h * .105, seed + 31);
  leafMass(c, crownX + w * .22, crownY - h * .01, w * .34, h * .10, seed + 32);
  leafMass(c, crownX, crownY - h * .075, w * .38, h * .095, seed + 33, true);
  // Deep mass first, then lit upper clusters, both overlapping the trunk tip.
  for (let i = 0; i < 12; i++) {
    const r = random(seed + 20 + i * 9);
    const a = r() * 6.283, rad = .3 + r() * .68;
    leafMass(c, crownX + Math.cos(a) * w * .42 * rad, crownY + Math.sin(a) * h * .13 * rad,
      w * (.15 + r() * .11), h * (.07 + r() * .05), seed + 60 + i * 7);
  }
  for (let i = 0; i < 9; i++) {
    const r = random(seed + 240 + i * 7);
    leafMass(c, crownX + (r() - .5) * w * .78, crownY - h * .04 + (r() - .45) * h * .16,
      w * (.11 + r() * .08), h * (.045 + r() * .035), seed + 260 + i * 5, true);
  }
  // Broken silhouette at the rim.
  for (let i = 0; i < 60; i++) {
    const r = random(seed + 600 + i);
    const a = r() * 6.283;
    daub(c, crownX + Math.cos(a) * w * (.44 + r() * .16), crownY + Math.sin(a) * h * (.14 + r() * .06),
      8 + r() * 24, 2 + r() * 4, a, i % 3 ? '#4C674A' : '#8A8B5C', r);
  }
  // Warm earth shadow under the canopy.
  c.globalAlpha = .16;
  for (let i = 0; i < 18; i++) {
    const r = random(seed + 700 + i);
    daub(c, crownX + (r() - .5) * w * .42, crownY + h * (.18 + r() * .2), 15 + r() * 34, 2,
      -1.57, '#8B7049', r);
  }
  c.globalAlpha = 1;
};

/** A tapering branch with side twigs; leaves sit along it instead of floating beside a pole. */
const bough = (c: Ctx, seed: number) => {
  const r = random(seed);
  pigment(c, polygon([[0, 1130], [90, 1090], [300, 1060], [560, 1018], [700, 992],
    [748, 1002], [560, 1040], [320, 1090], [100, 1140], [0, 1170]]),
    [0, 990, 750, 180], ['#3A3024', '#574431', '#6C5338', '#29251E'], seed, 620, -.05, 1.1);
  c.strokeStyle = 'rgba(52,42,30,.9)'; c.lineCap = 'round';
  for (const [x1, y1, x2, y2, wd] of [[250, 1084, 188, 960, 15], [430, 1050, 480, 936, 12],
    [600, 1010, 660, 902, 10], [700, 994, 780, 1040, 8]]) {
    c.lineWidth = wd; c.beginPath(); c.moveTo(x1, y1);
    c.quadraticCurveTo((x1 + x2) / 2 + 14, (y1 + y2) / 2, x2, y2); c.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const cx = 140 + t * 740, cy = 1000 - t * 90 + (r() - .5) * 40;
    const rx = 34 + r() * 46, ry = 20 + r() * 26;
    leafMass(c, cx, cy - 20 - r() * 30, rx, ry, seed + 40 + i * 11, i % 3 === 0);
  }
};

const town = (c: Ctx) => {
  ground(c, ['#2A4657', '#6B7C71', '#B08B58', '#172F40'], 2101, 3800);
  pigment(c, rectangle(0, 0, 1080, 800), [0, 0, 1080, 800],
    ['#27475E', '#6F8790', '#D8A55E', '#173247'], 2102, 2400, -.12, 1.9);
  pigment(c, polygon([[0, 620], [210, 548], [420, 608], [640, 532], [860, 596], [1080, 512],
    [1080, 790], [0, 790]]), [0, 512, 1080, 278], ['#334E59', '#5C6E64', '#8B7B58'], 2103, 1300, -.02, 1.4);
  // Courthouse: pilasters, tall windows, double door, clock.
  pigment(c, rectangle(300, 560, 480, 570), [300, 560, 480, 570], cream, 2110, 1500, -1.5);
  for (let y = 600; y < 1120; y += 58) {
    c.globalAlpha = .2; daub(c, 540, y, 470, 2, 0, '#6E654C', random(2111 + y)); c.globalAlpha = 1;
  }
  pigment(c, polygon([[268, 568], [540, 424], [812, 568], [790, 590], [540, 462], [290, 590]]),
    [268, 420, 544, 180], ['#C9B68C', '#E2D0A6', '#9E926C'], 2112, 520, -.1);
  for (let x = 320; x <= 760; x += 110) {
    pigment(c, rectangle(x, 630, 42, 440), [x, 630, 42, 440], ['#D2BF95', '#B7A47B', '#8D8562'], 2113 + x, 180, -1.5);
    line(c, x + 42, 630, x + 42, 1070, 4, 'rgba(73,64,46,.55)');
  }
  for (const x of [376, 500, 620]) {
    pigment(c, rectangle(x, 690, 86, 250), [x, 690, 86, 250], ['#1B333C', '#2B4549', '#6D6247'], 2120 + x, 260, -1.5, .7);
    for (let yy = 720; yy < 930; yy += 44) daub(c, x + 43, yy, 82, 2, 0, '#3A4A44', random(2121 + x + yy));
    daub(c, x + 43, 815, 76, 90, 0, '#B89454', random(2122 + x));
    c.globalAlpha = .35; daub(c, x + 43, 815, 76, 78, 0, '#E3BC73', random(2123 + x)); c.globalAlpha = 1;
  }
  pigment(c, polygon([[492, 1080], [492, 900], [522, 884], [558, 884], [588, 900], [588, 1080]]),
    [490, 882, 100, 200], ['#3E3225', '#5B4632', '#2C2A23'], 2130, 280, -1.5, .6);
  line(c, 540, 908, 540, 1076, 4, '#2C241C');
  pigment(c, rectangle(482, 306, 116, 168), [482, 306, 116, 168], cream, 2131, 360, -1.5);
  pigment(c, polygon([[456, 314], [540, 224], [624, 314]]), [456, 224, 168, 90],
    ['#8A7450', '#B29765', '#5D5842'], 2132, 260, -.1);
  pigment(c, oval(540, 386, 38, 38), [500, 346, 80, 80], ['#E2C27B', '#C09B52', '#F2DEA0'], 2133, 120, 0, .4);
  line(c, 540, 386, 548, 366, 4, '#5B4A30');
  line(c, 540, 386, 558, 394, 4, '#5B4A30');
  pigment(c, polygon([[250, 1130], [830, 1130], [910, 1180], [170, 1180]]),
    [170, 1130, 740, 50], ['#C5B087', '#9F9370', '#7C775B'], 2134, 380, 0);
  for (const [x, w] of [[0, 190], [890, 190]]) {
    pigment(c, rectangle(x, 760, w, 400), [x, 760, w, 400], ['#8A7A58', '#B09B6D', '#665F49'], 2140 + x, 700, -1.5);
    pigment(c, polygon([[x - 18, 760], [x + w + 18, 760], [x + w - 6, 828], [x + 8, 828]]),
      [x - 18, 760, w + 36, 68], ['#5A4A36', '#7B6244', '#3C4038'], 2141 + x, 220, -.05);
    for (const xx of [x + 34, x + 116]) {
      pigment(c, rectangle(xx, 862, 46, 150), [xx, 862, 46, 150], ['#C09956', '#E2BC73', '#7B623A'], 2142 + xx, 130, -1.5, .4);
      daub(c, xx + 23, 937, 34, 110, 0, '#F0CE8B', random(2143 + xx));
    }
  }
  pigment(c, polygon([[0, 1920], [335, 1180], [745, 1180], [1080, 1920]]),
    [0, 1180, 1080, 740], ['#7B6A4E', '#A88C60', '#504F45'], 2150, 1800, -.06);
  const r = random(2151);
  for (let i = 0; i < 110; i++) {
    const y = 1240 + r() * 640, x = 540 + (r() - .5) * (120 + (y - 1200) * 1.35);
    daub(c, x, y, 10 + (y - 1200) * .04, 2 + r() * 3, Math.atan2(y - 1180, x - 540),
      i % 3 ? '#B59A6C' : '#C6AA78', r);
  }
  pigment(c, polygon([[0, 1920], [210, 1180], [330, 1180], [120, 1920]]),
    [0, 1180, 330, 740], ['#9A8B69', '#B6A37B', '#6B6650'], 2152, 380, -.05);
  pigment(c, polygon([[1080, 1920], [870, 1180], [750, 1180], [960, 1920]]),
    [750, 1180, 330, 740], ['#9A8B69', '#B6A37B', '#6B6650'], 2153, 380, .05);
  oak(c, -30, 470, 300, 800, 2160);
  oak(c, 1000, 450, 280, 840, 2170);
  for (const [x, y] of [[185, 1180], [895, 1180], [540, 1120]]) {
    beam(c, x - 7, y - 170, 14, 360, 2180 + x);
    pigment(c, oval(x, y - 190, 34, 46), [x - 34, y - 236, 68, 92],
      ['#D9B266', '#F0D596', '#8F713F'], 2181 + x, 110, -1.5, .35);
    glaze(c, x, y - 190, 190, '#F2C979', .32);
  }
  glaze(c, 540, 690, 640, '#E6B76D', .12);
  glaze(c, 120, 1720, 540, '#0A1D2B', .3);
};

const porch = (c: Ctx) => {
  ground(c, ['#5B4934', '#7C5D3F', '#94724B', '#2F3934'], 2201, 3800);
  pigment(c, rectangle(0, 0, 1080, 1040), [0, 0, 1080, 1040],
    ['#6C5238', '#886846', '#4A4435', '#9B7C54'], 2202, 2200, -.1, 1.4);
  const r = random(2203);
  for (let y = 60; y < 1000; y += 52) {
    c.globalAlpha = .5; daub(c, 540, y, 1020, 4, 0, y % 104 ? '#5B4632' : '#A08358', r); c.globalAlpha = 1;
  }
  // Warm windows: dark frames hold painted lamplight.
  for (const [x, y, w, h] of [[80, 236, 250, 360], [748, 210, 258, 380]]) {
    pigment(c, rectangle(x, y, w, h), [x, y, w, h], ['#3D3B2F', '#6B5538', '#2B312D'], 2210 + x, 320, -1.5);
    pigment(c, rectangle(x + 18, y + 18, w - 36, h - 36), [x, y, w, h],
      ['#C29353', '#E5BC74', '#8A6739'], 2211 + x, 260, -1.5, .6);
    daub(c, x + w * .5, y + h * .48, w - 60, h - 70, 0, '#F0CB86', r);
    beam(c, x + w * .5, y + 18, 12, h - 36, 2212 + x, ['#4A3B2B', '#6A5236']);
    beam(c, x + 18, y + h * .52, w - 36, 12, 2213 + x, ['#4A3B2B', '#6A5236']);
    beam(c, x - 14, y - 14, w + 28, 16, 2214 + x, wood);
    beam(c, x - 14, y + h, w + 28, 16, 2215 + x, wood);
    glaze(c, x + w * .5, y + h * .5, 280, '#F0C477', .5);
  }
  pigment(c, rectangle(430, 300, 226, 700), [430, 300, 226, 700], dark, 2220, 620, -1.5, .7);
  pigment(c, rectangle(446, 330, 194, 650), [446, 330, 194, 650], ['#8B6B3F', '#C79A57', '#584832'], 2221, 420, -1.5, .6);
  for (let i = 0; i < 9; i++) beam(c, 454 + i * 22, 340, 5, 630, 2222 + i, ['#4A3C2C', '#6A5337']);
  glaze(c, 540, 610, 190, '#E8BA69', .4);
  pigment(c, polygon([[0, 1250], [1080, 1250], [1080, 1920], [0, 1920]]),
    [0, 1250, 1080, 670], ['#8A6440', '#A57C4D', '#6B4F36', '#C09963'], 2230, 2000, -.03);
  const rr = random(2231);
  for (let i = 0; i < 110; i++) daub(c, rr() * 1080, 1270 + rr() * 640, 50 + rr() * 170,
    2 + rr() * 4, -.02, i % 3 ? '#B68E5A' : '#765639', rr);
  beam(c, 0, 1150, 1080, 26, 2232);
  for (const x of [26, 1040]) beam(c, x, 300, 30, 870, 2233 + x, ['#5B4632', '#7C5E3F', '#443D30']);
  for (let x = 90; x < 1000; x += 72) beam(c, x, 1110, 10, 90, 2234 + x, ['#7E5D3E', '#9D7950']);
  beam(c, 0, 1180, 1080, 18, 2235);
  // Rocking chair with curved runners.
  pigment(c, polygon([[264, 1050], [406, 1050], [414, 1120], [256, 1120]]), [256, 1050, 158, 70], wood, 2240, 220, 0, .5);
  for (const x of [268, 392]) beam(c, x, 930, 14, 210, 2241 + x, wood);
  for (let i = 0; i < 5; i++) beam(c, 288 + i * 22, 944, 8, 158, 2242 + i, wood);
  beam(c, 248, 1134, 176, 16, 2243);
  for (const x of [260, 398]) beam(c, x, 1148, 12, 120, 2244 + x, wood);
  c.strokeStyle = '#5B4632'; c.lineWidth = 12;
  c.beginPath(); c.moveTo(220, 1280); c.quadraticCurveTo(340, 1330, 460, 1280); c.stroke();
  oak(c, 880, 360, 260, 940, 2250);
  pigment(c, oval(930, 1680, 150, 88), [780, 1592, 300, 176],
    ['#3D5845', '#52684B', '#6F7A54', '#7E8259'], 2251, 620, 0, 1.6);
  for (let i = 0; i < 34; i++) {
    const r = random(2252 + i);
    daub(c, 800 + r() * 260, 1620 + r() * 130, 8 + r() * 20, 2 + r() * 4,
      r() * 3.14, i % 3 ? '#4A644C' : '#8A8C60', r);
  }
  glaze(c, 540, 300, 640, '#D9A75D', .15);
  glaze(c, 60, 1780, 520, '#1A2320', .26);
};

const booHouse = (c: Ctx) => {
  ground(c, ['#122B3E', '#284A58', '#3D6270', '#0C1E2E'], 2301, 3600);
  pigment(c, rectangle(0, 0, 1080, 1000), [0, 0, 1080, 1000],
    ['#17364A', '#315A68', '#4C6F72', '#0E2233'], 2302, 2000, -.15, 1.7);
  pigment(c, oval(820, 205, 58, 58), [760, 145, 120, 120], ['#D9CEA6', '#F0E7C5', '#A9A27E'], 2303, 160, 0, .35);
  glaze(c, 820, 205, 260, '#D7D0B0', .2);
  pigment(c, polygon([[190, 1240], [190, 520], [540, 330], [890, 520], [890, 1240]]),
    [190, 330, 700, 910], ['#2C4146', '#3D5552', '#1A303B', '#536055'], 2310, 1900, -1.5);
  for (let y = 560; y < 1230; y += 46) {
    c.globalAlpha = .35; daub(c, 540, y, 680, 2, 0, '#0F262F', random(2311 + y)); c.globalAlpha = 1;
  }
  pigment(c, polygon([[150, 536], [540, 300], [930, 536], [900, 580], [540, 350], [180, 580]]),
    [150, 300, 780, 280], ['#3A3A33', '#575044', '#262D30'], 2312, 560, -.04);
  for (const [x, y, w, h, lit] of [[244, 600, 150, 240, 0], [700, 620, 150, 230, 0],
    [250, 960, 140, 210, 0], [690, 960, 140, 210, 0], [438, 600, 118, 240, 1]]) {
    pigment(c, rectangle(x, y, w, h), [x, y, w, h],
      lit ? ['#B6AA86', '#D7CBA6', '#8A866B'] : ['#162B34', '#293F43', '#46524A'], 2320 + x, 260, -1.5, .5);
    beam(c, x - 8, y - 8, w + 16, 10, 2321 + x, ['#3C3B31', '#615747']);
    if (!lit) for (let yy = y + 30; yy < y + h; yy += 46) beam(c, x, yy, w, 7, 2322 + x + yy, ['#2B3B38', '#43504A']);
  }
  glaze(c, 497, 720, 180, '#E8DDBA', .38);
  pigment(c, polygon([[680, 1240], [680, 1060], [860, 1060], [860, 1240]]),
    [680, 1060, 180, 180], ['#1A3038', '#31504A', '#5C5B45'], 2330, 240, -1.5, .5);
  for (const x of [700, 820]) beam(c, x, 1080, 12, 160, 2331 + x, ['#3D3B31', '#5C5342']);
  for (const x of [214, 294, 760, 842]) beam(c, x, 900, 14, 360, 2332 + x, ['#3D3B31', '#5C5342']);
  pigment(c, polygon([[0, 1920], [0, 1300], [150, 1240], [930, 1240], [1080, 1310], [1080, 1920]]),
    [0, 1240, 1080, 680], ['#263C3C', '#42514A', '#5D614F', '#162A33'], 2340, 1800, -.04);
  for (let x = 0; x < 1080; x += 54) {
    beam(c, x, 1270, 9, 260, 2341 + x, ['#4E4636', '#6C5C43']);
    if (x > 380 && x < 620) pigment(c, rectangle(x, 1290, 46, 20), [x, 1290, 46, 20], wood, 2342 + x, 40, 0, .3);
  }
  beam(c, 0, 1310, 1080, 14, 2343, ['#4E4636', '#6C5C43']);
  oak(c, 40, 470, 280, 900, 2350);
  const r = random(2360);
  c.globalAlpha = .6;
  for (let i = 0; i < 260; i++) daub(c, r() * 1080, 1400 + r() * 480, 8 + r() * 22, 2 + r() * 4,
    -1.57 + (r() - .5) * .9, i % 3 ? '#2F4941' : '#657052', r);
  c.globalAlpha = 1;
  glaze(c, 480, 700, 620, '#B8AE8C', .08);
  glaze(c, 1010, 1820, 500, '#081822', .4);
};

const court = (c: Ctx) => {
  ground(c, ['#2B4147', '#5A5A45', '#806C48', '#182F3A'], 2401, 3800);
  pigment(c, rectangle(0, 0, 1080, 980), [0, 0, 1080, 980],
    ['#6B5E44', '#8D7854', '#4B5147', '#A18C64'], 2402, 2100, -.1, 1.5);
  for (const [x, y, w, h] of [[120, 100, 240, 380], [350, 90, 210, 390], [760, 110, 230, 370]]) {
    pigment(c, rectangle(x, y, w, h), [x, y, w, h], ['#B6AE8D', '#DED4AE', '#8A8E78'], 2410 + x, 520, -1.5, .7);
    beam(c, x + w * .5, y, 10, h, 2411 + x, ['#4A4636', '#6A5B43']);
    for (let yy = y + 40; yy < y + h; yy += 60) beam(c, x, yy, w, 7, 2412 + x + yy, ['#4A4636', '#6A5B43']);
  }
  // High bench with panelled front; the judge sits behind it.
  pigment(c, rectangle(308, 760, 464, 300), [308, 760, 464, 300], wood, 2420, 900, -1.5);
  for (let x = 330; x < 760; x += 110) {
    pigment(c, rectangle(x, 800, 86, 210), [x, 800, 86, 210], ['#6C5337', '#8B6C45', '#4A3E30'], 2421 + x, 200, -1.5, .5);
    line(c, x, 800, x + 86, 1010, 3, 'rgba(50,42,32,.4)');
  }
  pigment(c, polygon([[250, 1010], [830, 1010], [870, 1110], [210, 1110]]),
    [210, 1010, 660, 100], wood, 2422, 460, 0);
  pigment(c, polygon([[250, 1010], [830, 1010], [842, 1034], [238, 1034]]),
    [238, 1010, 604, 24], ['#4B3B2C', '#705233', '#917046'], 2423, 200, 0);
  // Judge's gavel and hand.
  pigment(c, polygon([[512, 1032], [566, 1032], [566, 1044], [512, 1044]]), [512, 1032, 54, 12],
    ['#C6A46A', '#E2C28A'], 2424, 50, 0, .3);
  pigment(c, oval(586, 1018, 20, 16), [566, 1002, 40, 32], ['#A88E68', '#C6AA7D'], 2425, 70, 0, .3);
  // Six jury members: shoulders and heads above the box rail.
  for (let i = 0; i < 6; i++) {
    const x = 792 + (i % 3) * 88, y = 1030 + Math.floor(i / 3) * 96;
    pigment(c, polygon([[x - 26, y + 100], [x - 18, y + 60], [x, y + 42], [x + 20, y + 62], [x + 28, y + 100]]),
      [x - 30, y + 38, 62, 66], ['#5B5A4B', '#7B7358', '#3E463F'], 2430 + i, 100, -1.5, .4);
    pigment(c, oval(x, y + 28, 16, 20), [x - 18, y + 6, 36, 44], i % 2 ? ['#A58D6A', '#C3A981'] : ['#6B4A38', '#8C6348'], 2436 + i, 60, 0, .3);
  }
  // Gallery benches and seated backs.
  for (let i = 0; i < 3; i++) {
    const y = 900 + i * 130;
    beam(c, 0, y, 300, 26, 2440 + i);
    for (let x = 18; x < 300; x += 46) {
      pigment(c, polygon([[x, y - 4], [x + 30, y - 4], [x + 34, y - 70], [x + 6, y - 76], [x - 2, y - 40]]),
        [x - 4, y - 78, 40, 76], ['#334541', '#4B5850', '#243531'], 2441 + i * 20 + x, 60, -1.5, .3);
      pigment(c, oval(x + 16, y - 82, 11, 13), [x + 4, y - 96, 24, 28], ['#8C7A5A', '#AA906A'], 2442 + i * 20 + x, 40, 0, .3);
    }
  }
  pigment(c, polygon([[405, 1210], [655, 1210], [690, 1320], [370, 1320]]),
    [370, 1210, 320, 110], wood, 2450, 380, 0);
  pigment(c, polygon([[420, 1218], [640, 1218], [648, 1250], [412, 1250]]),
    [412, 1218, 236, 32], ['#4B3B2C', '#705233'], 2451, 120, 0);
  pigment(c, polygon([[0, 1920], [300, 1330], [790, 1330], [1080, 1920]]),
    [0, 1330, 1080, 590], ['#6C5C42', '#917A52', '#4C4D43'], 2452, 1800, -.05);
  pigment(c, polygon([[270, 1330], [820, 1330], [900, 1400], [190, 1400]]),
    [190, 1330, 710, 70], ['#4A4033', '#6F5B3E', '#8A704B'], 2453, 340, 0);
  beam(c, 0, 1350, 1080, 16, 2454, ['#4A4033', '#6F5B3E']);
  glaze(c, 540, 620, 560, '#DAC48E', .18);
  glaze(c, 60, 1800, 560, '#101F26', .34);
};

const trial = (c: Ctx) => {
  ground(c, ['#2A3E45', '#6A5C43', '#927B53', '#172A34'], 2501, 3600);
  pigment(c, rectangle(0, 0, 1080, 1050), [0, 0, 1080, 1050],
    ['#665B44', '#8A7554', '#4B5248', '#9D8962'], 2502, 2000, -.1, 1.5);
  pigment(c, rectangle(100, 80, 250, 380), [100, 80, 250, 380], ['#C5BC9A', '#E2D8B2', '#8F927D'], 2510, 520, -1.5, .7);
  beam(c, 225, 80, 12, 380, 2511, ['#4A4636', '#6A5B43']);
  for (let y = 120; y < 460; y += 62) beam(c, 100, y, 250, 8, 2512 + y, ['#4A4636', '#6A5B43']);
  // Witness stand with a lower rail.
  pigment(c, rectangle(110, 980, 390, 300), [110, 980, 390, 300], wood, 2520, 620, -1.5);
  for (let x = 132; x < 480; x += 86) {
    pigment(c, rectangle(x, 1010, 64, 230), [x, 1010, 64, 230], ['#6C5337', '#8B6C45', '#4A3E30'], 2521 + x, 160, -1.5, .5);
  }
  pigment(c, polygon([[110, 1280], [500, 1280], [530, 1370], [80, 1370]]),
    [80, 1280, 450, 90], wood, 2522, 320, 0);
  beam(c, 90, 1262, 430, 18, 2523);
  // Judge's bench back, jury shadows right.
  pigment(c, polygon([[330, 860], [780, 860], [810, 920], [300, 920]]),
    [300, 860, 510, 60], wood, 2530, 200, 0);
  pigment(c, rectangle(400, 700, 310, 170), [400, 700, 310, 170], ['#6A5138', '#8A6744', '#433B30'], 2531, 280, -1.5);
  for (let i = 0; i < 3; i++) {
    const x = 770 + (i % 2) * 96, y = 950 + Math.floor(i / 2) * 90;
    pigment(c, polygon([[x - 24, y + 96], [x - 18, y + 58], [x, y + 40], [x + 20, y + 58], [x + 26, y + 96]]),
      [x - 28, y + 36, 58, 64], ['#53605A', '#6E7867', '#3A4845'], 2532 + i, 90, -1.5, .4);
    pigment(c, oval(x, y + 26, 14, 18), [x - 16, y + 6, 32, 40], ['#8C7A5A', '#A9906C'], 2535 + i, 50, 0, .3);
  }
  pigment(c, polygon([[0, 1920], [260, 1340], [820, 1340], [1080, 1920]]),
    [0, 1340, 1080, 580], ['#6A5A41', '#8C754E', '#484A41'], 2540, 1600, -.05);
  beam(c, 0, 1310, 1080, 18, 2541, ['#4A4033', '#6F5B3E']);
  for (let x = 40; x < 1080; x += 120) beam(c, x, 1318, 10, 130, 2542 + x, ['#4A4033', '#6F5B3E']);
  glaze(c, 250, 400, 560, '#D8C48F', .18);
  glaze(c, 1010, 1700, 500, '#0C1B22', .36);
};

const walk = (c: Ctx) => {
  ground(c, ['#152D3D', '#2C4B57', '#4E615C', '#0B1D2B'], 2601, 3600);
  pigment(c, rectangle(0, 0, 1080, 680), [0, 0, 1080, 680],
    ['#122C40', '#2F5363', '#6F7A70', '#081B2A'], 2602, 2000, -.15, 1.8);
  for (let i = 0; i < 5; i++) {
    const x = i * 230 - 30, w = 200, y = 400 + (i % 2) * 60, h = 720 - (i % 2) * 40;
    pigment(c, polygon([[x, y + 90], [x + w * .5, y - 50], [x + w, y + 90], [x + w, y + h], [x, y + h]]),
      [x, y - 50, w, h + 50], ['#263F45', '#3C5352', '#1A3039', '#566054'], 2610 + i, 800, -1.5);
    for (const xx of [x + 36, x + w - 82]) {
      pigment(c, rectangle(xx, y + 180, 46, 96), [xx, y + 180, 46, 96],
        ['#C09956', '#E2BC73', '#7B623A'], 2620 + i + xx, 110, -1.5, .4);
      glaze(c, xx + 23, y + 228, 120, '#E6B96B', .3);
    }
  }
  pigment(c, polygon([[0, 1920], [330, 1080], [750, 1080], [1080, 1920]]),
    [0, 1080, 1080, 840], ['#3B4747', '#5A6255', '#1D313C'], 2630, 2200, -.04);
  pigment(c, polygon([[0, 1920], [220, 1080], [340, 1080], [110, 1920]]),
    [0, 1080, 340, 840], ['#6C6853', '#8B8468', '#4A4F45'], 2631, 520, -.02);
  pigment(c, polygon([[1080, 1920], [860, 1080], [740, 1080], [970, 1920]]),
    [740, 1080, 340, 840], ['#6C6853', '#8B8468', '#4A4F45'], 2632, 520, .02);
  for (const [x, y] of [[185, 1110], [545, 1080], [900, 1110]]) {
    beam(c, x - 8, y - 250, 16, 430, 2640 + x, ['#3A3A32', '#575143']);
    pigment(c, oval(x, y - 270, 34, 46), [x - 34, y - 316, 68, 92],
      ['#D9B266', '#F0D596', '#8F713F'], 2641 + x, 110, -1.5, .35);
    glaze(c, x, y - 270, 240, '#F0C46E', .34);
    for (let k = 0; k < 18; k++) {
      const r = random(2642 + x + k);
      daub(c, x + (r() - .5) * 130, 1250 + r() * 520, 10 + r() * 34, 2, 1.57, '#D3AE67', r);
    }
  }
  oak(c, -10, 360, 260, 840, 2650);
  oak(c, 1010, 350, 260, 860, 2660);
  glaze(c, 540, 500, 720, '#244A5C', .12);
  glaze(c, 540, 1800, 700, '#0A1924', .28);
};

const night = (c: Ctx) => {
  ground(c, ['#0F2737', '#234653', '#3C5D5B', '#071824'], 2701, 3600);
  pigment(c, rectangle(0, 0, 1080, 1180), [0, 0, 1080, 1180],
    ['#0C2638', '#264B5B', '#416772', '#061826'], 2702, 2400, -.16, 1.8);
  // Moon centred between the two oaks, clear of both crowns.
  pigment(c, oval(540, 210, 58, 58), [482, 152, 116, 116], ['#D7CCAA', '#F1E8C9', '#9E9A7C'], 2703, 150, 0, .35);
  glaze(c, 540, 210, 330, '#C9CAB7', .2);
  // Distant tree line, then the two oaks flanking the path.
  pigment(c, polygon([[0, 1180], [0, 1080], [90, 1040], [150, 1080], [230, 1030], [300, 1080],
    [420, 1040], [500, 1080], [620, 1030], [700, 1080], [820, 1040], [900, 1080],
    [1000, 1030], [1080, 1070], [1080, 1180]]),
    [0, 1020, 1080, 160], ['#17302F', '#274239', '#35503F'], 2704, 900, -.02, 1.2);
  oak(c, -50, 390, 320, 800, 2710);
  oak(c, 810, 410, 330, 800, 2711);
  pigment(c, polygon([[0, 1920], [0, 1260], [200, 1180], [900, 1180], [1080, 1260], [1080, 1920]]),
    [0, 1180, 1080, 740], ['#2A4946', '#486052', '#667050', '#183333'], 2720, 1800, -.04);
  pigment(c, polygon([[0, 1920], [300, 1400], [780, 1400], [1080, 1920]]),
    [0, 1400, 1080, 520], ['#575B4B', '#747255', '#3A433C'], 2721, 1200, -.04);
  // Lit window behind the children.
  pigment(c, rectangle(780, 1030, 120, 140), [780, 1030, 120, 140], ['#8B6B3F', '#C9A25A'], 2730, 150, -1.5, .4);
  glaze(c, 840, 1100, 260, '#E8B967', .26);
  const r = random(2740);
  c.globalAlpha = .42;
  for (let i = 0; i < 180; i++) daub(c, r() * 1080, 1430 + r() * 450, 8 + r() * 24, 2 + r() * 3,
    -1.57 + (r() - .5) * .9, i % 3 ? '#3B5147' : '#76765A', r);
  c.globalAlpha = 1;
  glaze(c, 540, 210, 700, '#66808A', .08);
  glaze(c, 1080, 1840, 680, '#050F17', .4);
};

const booPorch = (c: Ctx) => {
  ground(c, ['#4C4A3D', '#7A6247', '#9B7B54', '#253D45'], 2801, 3800);
  pigment(c, rectangle(0, 0, 1080, 700), [0, 0, 1080, 700],
    ['#1B3A54', '#4B6B79', '#C9A06B', '#E0B77D'], 2802, 2200, -.1, 1.8);
  pigment(c, polygon([[0, 1480], [0, 760], [190, 720], [890, 720], [1080, 760], [1080, 1480]]),
    [0, 700, 1080, 780], ['#6A705D', '#8C8968', '#B49A72', '#4C5D58'], 2810, 1800, -.03);
  pigment(c, polygon([[0, 1480], [360, 1420], [720, 1420], [1080, 1480]]),
    [0, 1420, 1080, 60], ['#3E4B45', '#5A5F50', '#2A3C3E'], 2811, 400, 0);
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1, x = side > 0 ? 760 + i * 42 : 320 - i * 58;
    pigment(c, polygon([[x, 980], [x + 120, 940], [x + 120, 1320], [x, 1360]]),
      [x - 10, 920, 150, 460], ['#40544E', '#60705D', '#263D42', '#8C8261'], 2820 + i, 520, -1.5);
    for (let k = 0; k < 3; k++) {
      const xx = x + 22 + k * 32;
      pigment(c, rectangle(xx, 1030, 18, 40), [xx, 1030, 18, 40], ['#D0AA64', '#E9C27A'], 2824 + i * 3 + k, 60, -1.5, .3);
      glaze(c, xx + 9, 1050, 90, '#EFC06F', .22);
    }
  }
  for (const [x, y] of [[300, 1360], [760, 1340]]) {
    beam(c, x - 6, y - 180, 12, 240, 2830 + x, ['#3A3A32', '#575143']);
    pigment(c, oval(x, y - 195, 24, 32), [x - 24, y - 230, 48, 70], ['#D9B266', '#F0D596'], 2831 + x, 70, -1.5, .3);
    glaze(c, x, y - 195, 190, '#F0C46E', .3);
  }
  oak(c, 40, 500, 250, 860, 2840);
  oak(c, 1010, 480, 250, 900, 2850);
  pigment(c, rectangle(0, 0, 1080, 120), [0, 0, 1080, 120], ['#3C362B', '#5C4E39', '#2A2C27'], 2860, 420, 0);
  for (const x of [46, 996]) beam(c, x, 0, 38, 1500, 2861 + x, ['#4C4031', '#6A563B', '#383126']);
  pigment(c, polygon([[0, 1920], [0, 1500], [90, 1450], [990, 1450], [1080, 1500], [1080, 1920]]),
    [0, 1450, 1080, 470], ['#7C5D3F', '#9B7950', '#5B4634'], 2862, 1400, -.02);
  beam(c, 0, 1360, 1080, 22, 2863, ['#4C4031', '#6A563B']);
  for (let x = 80; x < 1000; x += 84) beam(c, x, 1290, 10, 72, 2864 + x, ['#5B4A37', '#7A6143']);
  pigment(c, rectangle(890, 560, 190, 800), [890, 560, 190, 800], ['#2A3B3B', '#46544A', '#1A2C32'], 2870, 480, -1.5, .6);
  glaze(c, 930, 900, 160, '#D7A95F', .16);
  glaze(c, 540, 300, 760, '#E9C183', .18);
  glaze(c, 540, 1840, 700, '#151F1B', .28);
};

const mockingbird = (c: Ctx) => {
  ground(c, ['#1B3550', '#456573', '#8E8467', '#132A3D'], 2901, 3600);
  pigment(c, rectangle(0, 0, 1080, 1400), [0, 0, 1080, 1400],
    ['#193850', '#416273', '#7B8270', '#0F2637'], 2902, 2200, -.12, 1.9);
  pigment(c, oval(800, 250, 76, 76), [710, 160, 180, 180], ['#D9CEAA', '#F2E8C8', '#A6A080'], 2903, 160, 0, .35);
  glaze(c, 800, 250, 380, '#D3CCB2', .2);
  pigment(c, polygon([[0, 1920], [0, 1640], [90, 1580], [170, 1630], [260, 1560], [340, 1620],
    [430, 1570], [520, 1630], [610, 1560], [700, 1620], [790, 1570], [880, 1630],
    [970, 1580], [1080, 1620], [1080, 1920]]),
    [0, 1550, 1080, 370], ['#17302F', '#2A4439', '#3D5541'], 2904, 1600, -.03, 1.2);
  bough(c, 2910);
  glaze(c, 540, 520, 760, '#496878', .1);
  glaze(c, 60, 1800, 620, '#071520', .36);
};

const reading = (c: Ctx) => {
  ground(c, ['#3B342B', '#5F4C38', '#826343', '#1C303B'], 3001, 3800);
  pigment(c, rectangle(0, 0, 1080, 1360), [0, 0, 1080, 1360],
    ['#4B4030', '#6B563D', '#8B714A', '#2E3A37'], 3002, 2200, -.1, 1.5);
  pigment(c, rectangle(190, 240, 610, 780), [190, 240, 610, 780], ['#142C40', '#294C5E', '#47636D'], 3010, 1400, -1.5, .7);
  for (const x of [190, 700]) beam(c, x, 240, 22, 780, 3011 + x, ['#332D24', '#4F4130']);
  beam(c, 190, 240, 610, 22, 3012, ['#332D24', '#4F4130']);
  beam(c, 190, 620, 610, 16, 3013, ['#332D24', '#4F4130']);
  beam(c, 495, 240, 12, 780, 3014, ['#332D24', '#4F4130']);
  pigment(c, polygon([[120, 180], [250, 200], [222, 980], [100, 1040]]),
    [100, 180, 160, 860], ['#6B4C3A', '#8F6A4B', '#513D30'], 3020, 520, -1.5, .8);
  pigment(c, polygon([[960, 180], [830, 200], [860, 980], [980, 1040]]),
    [830, 180, 160, 860], ['#6B4C3A', '#8F6A4B', '#513D30'], 3021, 520, -1.5, .8);
  pigment(c, rectangle(120, 1000, 840, 46), [120, 1000, 840, 46], wood, 3030, 280, 0);
  // Table raised so the book stays above the subtitle band.
  pigment(c, polygon([[0, 1920], [0, 1330], [1080, 1330], [1080, 1920]]),
    [0, 1330, 1080, 590], ['#4A382A', '#6E5237', '#8D6C47'], 3031, 1700, -.03);
  pigment(c, polygon([[100, 1336], [980, 1336], [1000, 1416], [80, 1416]]),
    [80, 1336, 920, 80], ['#3F3024', '#5D452D', '#7E5C3A'], 3032, 340, 0);
  // Table lamp at the right edge, its base resting on the table top.
  pigment(c, oval(934, 1402, 54, 15), [880, 1387, 108, 30], ['#2F2820', '#5C4A34', '#7B6344'], 3040, 110, 0, .3);
  beam(c, 926, 1206, 20, 200, 3041, ['#2F2820', '#5C4A34', '#8B714C']);
  pigment(c, polygon([[864, 1208], [1004, 1208], [982, 1108], [886, 1108]]),
    [864, 1108, 140, 100], ['#B98B48', '#E2B96B', '#7B5D35'], 3042, 220, 0, .6);
  glaze(c, 934, 1160, 340, '#F2C877', .42);
  glaze(c, 540, 500, 600, '#47657A', .12);
  glaze(c, 80, 1800, 560, '#101B1A', .32);
};

const treePlate = (c: Ctx) => {
  // A close-up of an old oak trunk; props are tucked into the knot hole.
  ground(c, ['#28332D', '#3E4436', '#5D4A34', '#17211F'], 3101, 3800);
  const r = random(3102);
  pigment(c, polygon([[90, 1920], [150, 300], [210, 110], [860, 90], [930, 320], [990, 1920]]),
    [90, 80, 900, 1840], ['#3B2E22', '#523D2A', '#2B251D', '#65503A'], 3103, 2400, -1.5, .75);
  // Deep vertical crevices and chunky, dark bark plates.
  for (let i = 0; i < 34; i++) {
    const x = 170 + r() * 760, y = 140 + r() * 1680, hh = 100 + r() * 380;
    c.strokeStyle = i % 3 ? 'rgba(30,24,18,.82)' : 'rgba(122,92,62,.55)';
    c.lineWidth = 4 + r() * 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y);
    c.bezierCurveTo(x + 16, y + hh * .3, x - 18, y + hh * .7, x + 4, y + hh); c.stroke();
  }
  c.globalAlpha = .7;
  for (let i = 0; i < 150; i++) {
    const x = 150 + r() * 800, y = 120 + r() * 1700;
    daub(c, x, y, 16 + r() * 54, 4 + r() * 10, -1.52 + (r() - .5) * .4,
      i % 4 ? '#2A241C' : '#6E5439', r);
  }
  for (let i = 0; i < 90; i++) {
    const x = 150 + r() * 800, y = 120 + r() * 1700;
    daub(c, x, y, 12 + r() * 40, 3 + r() * 7, -.05 + (r() - .5) * .3,
      i % 3 ? '#8A6744' : '#423326', r);
  }
  c.globalAlpha = 1;
  // Knot: a dark hollow ringed with raised bark.
  pigment(c, oval(540, 850, 150, 205), [390, 645, 300, 410],
    ['#5A4330', '#7C5D3C', '#3A2F24', '#2A221A'], 3110, 700, 0, .9);
  pigment(c, oval(540, 850, 124, 174), [416, 676, 248, 348], ['#1A1713', '#2E261E', '#111413'], 3112, 520, 0, .7);
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * 6.283;
    daub(c, 540 + Math.cos(a) * 138, 850 + Math.sin(a) * 190, 26 + r() * 20, 6 + r() * 7,
      a + 1.57, i % 3 ? '#4E3B2A' : '#6A5138', r);
  }
  // Moss gathers at the foot of the trunk.
  pigment(c, polygon([[0, 1920], [0, 1720], [220, 1620], [540, 1680], [880, 1610], [1080, 1700], [1080, 1920]]),
    [0, 1600, 1080, 320], ['#2F4138', '#445441', '#5D684A'], 3120, 1000, -.04);
  glaze(c, 540, 850, 330, '#050808', .36);
  glaze(c, 980, 240, 460, '#7A6443', .1);
};

export const paintTKAMPlate = (scene: TKAMScene) => makePaint(1080, 1920, c => {
  ({tkam_town: town, tkam_porch: porch, tkam_portraits: () => {
    ground(c, ['#2A3A3D', '#65573F', '#87714D', '#1A2B32'], 2001);
    for (let i = 0; i < 5; i++) beam(c, 0, 120 + i * 360, 1080, 8, 2002 + i, ['#2C3837', '#4A4435']);
  }, tkam_boo_house: booHouse, tkam_tree: treePlate, tkam_court: court,
  tkam_trial: trial, tkam_walk: walk, tkam_night: night, tkam_boo_porch: booPorch,
  tkam_mockingbird: mockingbird, tkam_reading: reading}[scene])(c);
});

/* ---------------- portraits ---------------- */
export type PortraitKind = 'scout' | 'jem' | 'dill' | 'atticus' | 'calpurnia' | 'boo' | 'tom';
const portraitSpec: Record<PortraitKind, {skin: string[]; hair: string[]; shirt: string[]; child: boolean; glasses?: boolean}> = {
  scout: {skin: ['#A88E68', '#C6AA7D', '#7B6C53'], hair: ['#5B4632', '#7B5C3D', '#3A2F26'], shirt: ['#7B8261', '#9AA378', '#55604E'], child: true},
  jem: {skin: ['#A98F69', '#C9AD80', '#7C6D54'], hair: ['#4A3A2B', '#6C5237', '#2F2822'], shirt: ['#5B6A73', '#7A8790', '#3D4D57'], child: true},
  dill: {skin: ['#B39872', '#D0B78A', '#86745A'], hair: ['#8A6B42', '#AE8A55', '#5A462F'], shirt: ['#8A6B45', '#A9875B', '#5C4934'], child: true},
  atticus: {skin: ['#A58D6A', '#C3A981', '#7A6C55'], hair: ['#4B4436', '#6C6350', '#302C25'], shirt: ['#B3A47D', '#CEBE95', '#8A7F60'], child: false, glasses: true},
  calpurnia: {skin: ['#6B4A38', '#8C6348', '#4C352A'], hair: ['#2E2721', '#473A2C', '#1D1A16'], shirt: ['#6E5B46', '#8F795B', '#4A4034'], child: false},
  boo: {skin: ['#A99C80', '#CAC0A4', '#7C7664'], hair: ['#6B6557', '#8C8574', '#4A463D'], shirt: ['#4C544B', '#667063', '#343C38'], child: false},
  tom: {skin: ['#6B4A38', '#8C6348', '#4C352A'], hair: ['#231C17', '#3B2E24', '#171310'], shirt: ['#8E8468', '#B0A685', '#5F5B4B'], child: false},
};
export const paintPortrait = (kind: PortraitKind) => makePaint(232, 300, c => {
  const s = portraitSpec[kind], r = random(3300 + kind.length * 17);
  pigment(c, rectangle(0, 0, 232, 300), [0, 0, 232, 300], ['#8A7048', '#B08D58', '#5B4A34'], 3310, 220, -1.5, .6);
  pigment(c, rectangle(12, 12, 208, 276), [12, 12, 208, 276], ['#33413E', '#4A554B', '#23322F'], 3311, 190, -.1, .6);
  pigment(c, polygon([[36, 284], [52, 214], [92, 190], [140, 190], [182, 214], [196, 284]]),
    [32, 188, 168, 100], s.shirt, 3312, 200, -1.5, .55);
  pigment(c, polygon([[104, 152], [128, 152], [134, 178], [98, 178]]), [98, 152, 36, 26],
    [s.skin[2], s.skin[0]], 3313, 50, -1.5, .3);
  pigment(c, oval(116, 118, 38, 44), [76, 72, 80, 92], s.skin, 3314, 190, 0, .45);
  pigment(c, polygon([[78, 112], [84, 82], [104, 68], [140, 70], [158, 92], [154, 112],
    [144, 94], [120, 86], [96, 94], [88, 114]]), [74, 64, 90, 58], s.hair, 3315, 140, -1.5, .45);
  daub(c, 103, 118, 8, 2.2, .02, '#2A2721', r);
  daub(c, 129, 118, 8, 2.2, .02, '#2A2721', r);
  daub(c, 116, 130, 4, 2, .02, s.skin[2], r);
  daub(c, 116, 142, 11, 1.6, .02, '#6A483E', r);
  daub(c, 116, 152, 20, 3, .02, s.skin[2], r);
  if (s.glasses) {
    c.strokeStyle = '#2E2A24'; c.lineWidth = 2.4;
    c.strokeRect(95, 110, 17, 13); c.strokeRect(121, 110, 17, 13);
    c.beginPath(); c.moveTo(112, 116); c.lineTo(121, 116); c.stroke();
  }
  pigment(c, polygon([[92, 180], [140, 180], [146, 220], [86, 220]]), [84, 178, 64, 44],
    [s.shirt[0], s.shirt[1]], 3316, 70, -1.5, .3);
  daub(c, 116, 200, 42, 3, -.04, '#D6C8A0', r);
  glaze(c, 100, 100, 150, '#E6C58A', .14);
});

/* ---------------- figures ---------------- */
export const paintAtticus = () => makePaint(200, 430, c => {
  const r = random(3401);
  // Shoes and separate trouser legs.
  pigment(c, oval(78, 414, 26, 10), [52, 404, 52, 20], ['#2C2822', '#44392C'], 3402, 50, 0, .3);
  pigment(c, oval(126, 414, 26, 10), [100, 404, 52, 20], ['#2C2822', '#44392C'], 3403, 50, 0, .3);
  pigment(c, polygon([[58, 296], [94, 296], [96, 412], [62, 412]]), [56, 296, 42, 116],
    ['#8A7E60', '#A99A77', '#6B6048'], 3404, 160, -1.5, .45);
  pigment(c, polygon([[108, 296], [144, 296], [140, 412], [106, 412]]), [106, 296, 40, 116],
    ['#8A7E60', '#A99A77', '#6B6048'], 3405, 160, -1.5, .45);
  // Jacket, shirt, tie.
  pigment(c, polygon([[54, 122], [92, 110], [108, 112], [124, 110], [150, 124], [160, 302], [42, 302]]),
    [42, 108, 118, 196], ['#B3A47D', '#CEBE95', '#8A7F60', '#D8C9A1'], 3406, 520, -1.5, .6);
  pigment(c, polygon([[90, 116], [112, 116], [118, 200], [84, 200]]), [84, 114, 36, 88],
    ['#E2D7B9', '#CBBF9F'], 3407, 90, -1.5, .3);
  pigment(c, polygon([[97, 122], [105, 122], [110, 196], [100, 196]]), [96, 120, 16, 80],
    ['#4A3E30', '#63513B'], 3408, 60, -1.5, .3);
  daub(c, 100, 104, 30, 8, .02, '#5A5040', r);
  // Arms and hands.
  pigment(c, polygon([[40, 140], [60, 130], [66, 288], [44, 296]]), [38, 128, 30, 170],
    ['#B3A47D', '#CEBE95', '#8A7F60'], 3409, 180, -1.5, .4);
  pigment(c, polygon([[140, 130], [160, 140], [158, 292], [138, 288]]), [138, 128, 24, 168],
    ['#B3A47D', '#CEBE95', '#8A7F60'], 3410, 180, -1.5, .4);
  pigment(c, oval(52, 300, 12, 16), [40, 284, 24, 32], ['#A58D6A', '#C3A981'], 3411, 50, 0, .3);
  pigment(c, oval(148, 300, 12, 16), [136, 284, 24, 32], ['#A58D6A', '#C3A981'], 3412, 50, 0, .3);
  // Head, neck, glasses.
  pigment(c, polygon([[92, 96], [114, 96], [114, 122], [92, 122]]), [92, 94, 22, 30],
    ['#8F7A58', '#A58D6A'], 3413, 40, -1.5, .3);
  const head = new Path2D('M84 66Q88 28 108 22Q132 24 136 60L132 82Q124 92 108 92Q92 88 84 72Z');
  pigment(c, head, [80, 18, 58, 78], ['#A58D6A', '#C3A981', '#7A6C55'], 3414, 160, 0, .4);
  pigment(c, polygon([[80, 56], [84, 28], [104, 18], [128, 22], [140, 40], [134, 58],
    [124, 42], [108, 36], [92, 42], [86, 58]]), [78, 16, 64, 46],
    ['#4B4436', '#6C6350', '#302C25'], 3415, 100, -1.5, .4);
  c.strokeStyle = '#2E2A24'; c.lineWidth = 3;
  c.strokeRect(91, 50, 14, 12); c.strokeRect(113, 50, 14, 12);
  c.beginPath(); c.moveTo(105, 56); c.lineTo(113, 56); c.stroke();
  daub(c, 108, 76, 13, 2, .02, '#6A483E', r);
  for (let i = 0; i < 5; i++) daub(c, 92 + i * 8, 142 + i * 6, 30 + r() * 14, 2, 1.5, '#9A8B69', r);
});

export const paintChild = () => makePaint(120, 240, c => {
  const r = random(3501);
  pigment(c, oval(52, 228, 12, 7), [36, 220, 32, 16], ['#2A2B25', '#3E3B30'], 3502, 30, 0, .3);
  pigment(c, oval(78, 228, 12, 7), [62, 220, 32, 16], ['#2A2B25', '#3E3B30'], 3503, 30, 0, .3);
  pigment(c, polygon([[48, 184], [58, 184], [56, 230], [46, 230]]), [44, 182, 16, 50],
    ['#A88E68', '#C6AA7D'], 3504, 40, -1.5, .3);
  pigment(c, polygon([[68, 184], [78, 184], [78, 230], [68, 230]]), [66, 182, 16, 50],
    ['#A88E68', '#C6AA7D'], 3505, 40, -1.5, .3);
  const dress = new Path2D('M38 78Q46 62 60 60Q76 62 82 78L92 150L100 192L82 198L72 168L74 188L60 194L46 188L48 168L38 198L20 192L28 150Z');
  pigment(c, dress, [16, 58, 88, 142], ['#7B8261', '#9AA378', '#55604E'], 3506, 380, -1.5, .5);
  pigment(c, polygon([[30, 96], [44, 94], [40, 150], [26, 152]]), [24, 92, 22, 64],
    ['#A88E68', '#C6AA7D'], 3507, 50, -1.5, .3);
  pigment(c, polygon([[84, 94], [96, 98], [98, 152], [84, 150]]), [82, 92, 20, 64],
    ['#A88E68', '#C6AA7D'], 3508, 50, -1.5, .3);
  const head = new Path2D('M44 44Q46 18 60 14Q78 16 80 42L76 58Q68 66 58 64Q48 60 44 50Z');
  pigment(c, head, [42, 12, 42, 58], ['#A88E68', '#C6AA7D', '#7B6C53'], 3509, 120, 0, .35);
  pigment(c, polygon([[42, 42], [44, 22], [58, 12], [74, 16], [82, 32], [78, 44],
    [70, 32], [58, 26], [48, 32], [46, 44]]), [40, 10, 46, 38], ['#5B4632', '#7B5C3D', '#3A2F26'], 3510, 70, -1.5, .35);
  daub(c, 53, 40, 5, 1.6, .02, '#2A2721', r); daub(c, 67, 40, 5, 1.6, .02, '#2A2721', r);
  daub(c, 60, 51, 7, 1.4, .02, '#6A483E', r);
  for (let i = 0; i < 5; i++) daub(c, 46 + i * 5, 96 + i * 8, 22 + r() * 12, 1.6, 1.5, '#6D7458', r);
});

export const paintBoy = () => makePaint(130, 260, c => {
  const r = random(3521);
  pigment(c, oval(54, 248, 12, 7), [38, 240, 32, 16], ['#2A2B25', '#3E3B30'], 3522, 30, 0, .3);
  pigment(c, oval(82, 248, 12, 7), [66, 240, 32, 16], ['#2A2B25', '#3E3B30'], 3523, 30, 0, .3);
  pigment(c, polygon([[52, 176], [62, 176], [60, 250], [48, 250]]), [46, 174, 18, 78],
    ['#A98F69', '#C9AD80'], 3524, 45, -1.5, .3);
  pigment(c, polygon([[70, 176], [80, 176], [84, 250], [72, 250]]), [68, 174, 18, 78],
    ['#A98F69', '#C9AD80'], 3525, 45, -1.5, .3);
  pigment(c, polygon([[44, 154], [88, 154], [94, 196], [38, 196]]), [36, 152, 60, 46],
    ['#4E5C60', '#68767A', '#36464C'], 3526, 80, -1.5, .3);
  const shirt = new Path2D('M40 76Q48 62 62 60Q78 62 86 76L98 152L84 160L78 134L80 156L60 160L40 156L42 134L36 160L22 152Z');
  pigment(c, shirt, [18, 58, 86, 106], ['#8A927A', '#A6AC8A', '#64705D'], 3527, 300, -1.5, .45);
  pigment(c, polygon([[30, 92], [42, 90], [38, 148], [26, 150]]), [22, 88, 22, 64],
    ['#A98F69', '#C9AD80'], 3528, 45, -1.5, .3);
  pigment(c, polygon([[84, 92], [96, 94], [98, 148], [85, 150]]), [82, 88, 20, 64],
    ['#A98F69', '#C9AD80'], 3529, 45, -1.5, .3);
  const head = new Path2D('M48 44Q50 18 64 14Q82 16 84 42L80 58Q72 66 62 64Q52 60 48 50Z');
  pigment(c, head, [46, 12, 44, 58], ['#A98F69', '#C9AD80', '#7C6D54'], 3530, 120, 0, .35);
  pigment(c, polygon([[46, 42], [48, 22], [62, 12], [78, 16], [86, 34], [82, 46],
    [74, 32], [62, 26], [52, 34], [50, 46]]), [44, 10, 46, 38], ['#4A3A2B', '#6C5237', '#2F2822'], 3531, 70, -1.5, .35);
  daub(c, 57, 40, 5, 1.6, .02, '#2A2721', r); daub(c, 71, 40, 5, 1.6, .02, '#2A2721', r);
  daub(c, 64, 51, 7, 1.4, .02, '#6A483E', r);
  for (let i = 0; i < 4; i++) daub(c, 52 + i * 7, 96 + i * 10, 24 + r() * 12, 1.6, 1.5, '#5F6A5C', r);
});

export const paintTom = () => makePaint(210, 430, c => {
  const r = random(3601);
  pigment(c, oval(78, 414, 26, 10), [52, 404, 52, 20], ['#26251F', '#3C372C'], 3602, 45, 0, .3);
  pigment(c, oval(136, 414, 26, 10), [110, 404, 52, 20], ['#26251F', '#3C372C'], 3603, 45, 0, .3);
  pigment(c, polygon([[64, 290], [100, 290], [98, 414], [66, 414]]), [62, 290, 40, 124],
    ['#3F5463', '#5B7181', '#2B3E4C'], 3604, 150, -1.5, .4);
  pigment(c, polygon([[112, 290], [148, 290], [146, 414], [112, 414]]), [110, 290, 38, 124],
    ['#3F5463', '#5B7181', '#2B3E4C'], 3605, 150, -1.5, .4);
  // Shirt with sleeves, overall bib and straps.
  pigment(c, polygon([[48, 124], [86, 110], [126, 112], [162, 126], [168, 300], [42, 300]]),
    [40, 108, 130, 196], ['#B0A685', '#CBBF9A', '#8E8468'], 3606, 520, -1.5, .55);
  pigment(c, polygon([[60, 180], [150, 180], [156, 300], [54, 300]]), [52, 178, 106, 124],
    ['#3F5463', '#5B7181', '#2B3E4C'], 3607, 320, -1.5, .45);
  for (const x of [72, 132]) pigment(c, polygon([[x, 124], [x + 14, 122], [x + 16, 192], [x + 2, 194]]),
    [x, 120, 20, 78], ['#3F5463', '#5B7181'], 3608 + x, 60, -1.5, .3);
  // The left arm hangs uselessly straight; the right is bent.
  pigment(c, polygon([[40, 136], [60, 128], [58, 300], [36, 304]]), [34, 124, 30, 184],
    ['#6B4A38', '#8C6348', '#4C352A'], 3610, 170, -1.5, .4);
  pigment(c, oval(47, 306, 11, 16), [36, 288, 22, 36], ['#6B4A38', '#8C6348'], 3611, 40, 0, .3);
  pigment(c, polygon([[150, 130], [170, 140], [170, 250], [152, 246]]), [150, 128, 24, 124],
    ['#6B4A38', '#8C6348', '#4C352A'], 3612, 90, -1.5, .4);
  // Head, short hair, face.
  pigment(c, polygon([[94, 98], [118, 98], [118, 124], [94, 124]]), [94, 96, 24, 30],
    ['#5F4233', '#7A5541'], 3613, 40, -1.5, .3);
  const head = new Path2D('M82 68Q88 30 108 24Q134 26 138 64L132 86Q122 94 106 94Q90 90 82 74Z');
  pigment(c, head, [80, 20, 60, 78], ['#6B4A38', '#8C6348', '#4C352A'], 3614, 160, 0, .4);
  pigment(c, polygon([[80, 60], [84, 32], [104, 22], [130, 26], [140, 44], [136, 62],
    [124, 44], [106, 38], [90, 46], [84, 62]]), [78, 20, 64, 46], ['#231C17', '#3B2E24'], 3615, 100, -1.5, .4);
  daub(c, 100, 58, 8, 2.2, .02, '#141311', r); daub(c, 120, 58, 8, 2.2, .02, '#141311', r);
  daub(c, 110, 82, 14, 2, .02, '#2E2420', r);
  for (let i = 0; i < 6; i++) daub(c, 92 + i * 5, 136 + i * 7, 34 + r() * 16, 2, 1.5, '#9C9274', r);
});

export const paintBoo = () => makePaint(220, 460, c => {
  const r = random(3701);
  pigment(c, oval(82, 444, 26, 10), [56, 434, 52, 20], ['#22241F', '#37352A'], 3702, 45, 0, .3);
  pigment(c, oval(144, 444, 26, 10), [118, 434, 52, 20], ['#22241F', '#37352A'], 3703, 45, 0, .3);
  pigment(c, polygon([[68, 318], [104, 318], [102, 444], [70, 444]]), [66, 318, 40, 126],
    ['#3A3A31', '#504C3C', '#292C28'], 3704, 140, -1.5, .4);
  pigment(c, polygon([[116, 318], [152, 318], [150, 444], [116, 444]]), [114, 318, 38, 126],
    ['#3A3A31', '#504C3C', '#292C28'], 3705, 140, -1.5, .4);
  // Worn shirt under a dark vest.
  pigment(c, polygon([[54, 126], [88, 112], [132, 112], [166, 128], [172, 320], [48, 320]]),
    [46, 110, 128, 212], ['#C4B995', '#D8CDA9', '#9A9278'], 3706, 520, -1.5, .5);
  pigment(c, polygon([[50, 128], [84, 118], [80, 300], [46, 310]]), [44, 116, 38, 196],
    ['#4C544B', '#667063', '#343C38'], 3707, 240, -1.5, .45);
  pigment(c, polygon([[136, 118], [170, 130], [174, 310], [140, 300]]), [136, 116, 40, 196],
    ['#4C544B', '#667063', '#343C38'], 3708, 240, -1.5, .45);
  pigment(c, polygon([[40, 140], [62, 132], [64, 316], [42, 322]]), [38, 130, 28, 194],
    ['#A99C80', '#CAC0A4', '#7C7664'], 3709, 170, -1.5, .4);
  pigment(c, oval(52, 326, 12, 16), [40, 310, 24, 32], ['#A99C80', '#CAC0A4'], 3710, 40, 0, .3);
  pigment(c, polygon([[158, 130], [180, 142], [180, 316], [160, 312]]), [158, 128, 26, 190],
    ['#A99C80', '#CAC0A4', '#7C7664'], 3711, 170, -1.5, .4);
  pigment(c, polygon([[96, 96], [124, 96], [124, 126], [96, 126]]), [96, 94, 28, 32],
    ['#94886E', '#A99C80'], 3712, 40, -1.5, .3);
  const head = new Path2D('M82 72Q86 30 110 24Q136 26 140 68L134 90Q124 98 108 98Q90 92 82 76Z');
  pigment(c, head, [80, 20, 60, 82], ['#A99C80', '#CAC0A4', '#7C7664'], 3713, 180, 0, .4);
  pigment(c, polygon([[78, 62], [82, 30], [104, 20], [132, 24], [142, 44], [136, 64],
    [124, 44], [106, 38], [90, 46], [84, 64]]), [76, 18, 68, 50], ['#6B6557', '#8C8574'], 3714, 110, -1.5, .4);
  daub(c, 100, 60, 8, 2.2, .02, '#20201D', r); daub(c, 122, 60, 8, 2.2, .02, '#20201D', r);
  daub(c, 110, 84, 14, 2, .02, '#5E4C42', r);
  for (let i = 0; i < 4; i++) daub(c, 90 + i * 10, 130 + i * 12, 40 + r() * 20, 2, 1.5, '#8D8870', r);
});

export const paintJudge = () => makePaint(210, 330, c => {
  const r = random(3760);
  // Black robe and white shirt above the high bench.
  pigment(c, polygon([[26, 330], [42, 150], [74, 128], [126, 128], [158, 150], [180, 330]]),
    [24, 126, 158, 204], ['#2C302E', '#3C403A', '#1E2221', '#4B4C43'], 3761, 520, -1.5, .6);
  pigment(c, polygon([[92, 132], [112, 132], [116, 210], [88, 210]]), [86, 130, 32, 82],
    ['#D7CDB0', '#BEB397'], 3762, 90, -1.5, .3);
  pigment(c, polygon([[86, 212], [118, 212], [126, 330], [78, 330]]), [76, 210, 52, 120],
    ['#2C302E', '#3C403A'], 3763, 140, -1.5, .3);
  pigment(c, polygon([[88, 96], [112, 96], [112, 128], [88, 128]]), [88, 94, 24, 34],
    ['#A58D6A', '#C3A981'], 3764, 50, -1.5, .3);
  const head = new Path2D('M80 64Q84 30 104 24Q128 26 132 62L128 82Q120 90 104 90Q88 86 80 70Z');
  pigment(c, head, [78, 22, 56, 70], ['#A58D6A', '#C3A981', '#7A6C55'], 3765, 170, 0, .4);
  pigment(c, polygon([[74, 58], [78, 30], [98, 20], [124, 22], [134, 40], [130, 58],
    [120, 40], [104, 34], [88, 42], [80, 58]]), [72, 18, 64, 44],
    ['#C8C2AE', '#E0DCC8', '#9E9989'], 3766, 120, -1.5, .4);
  c.strokeStyle = '#2E2A24'; c.lineWidth = 2.6;
  c.strokeRect(89, 54, 12, 10); c.strokeRect(107, 54, 12, 10);
  daub(c, 104, 76, 12, 2, .02, '#6A483E', r);
  daub(c, 104, 300, 34, 6, 1.57, '#8A8770', r);
});
export const paintHamCostume = () => makePaint(180, 250, c => {
  const r = random(3801);
  pigment(c, oval(90, 134, 76, 102), [10, 28, 160, 220], ['#8F6039', '#B27C4D', '#6B4229', '#C99661'], 3802, 620, -.1, .7);
  pigment(c, oval(90, 132, 60, 84), [24, 46, 132, 180], ['#A16E41', '#BE8955', '#7A4C30'], 3803, 340, 0, .6);
  // Wire mesh of the chicken-wire costume.
  c.globalAlpha = .5;
  for (let i = 0; i < 6; i++) {
    line(c, 34, 70 + i * 28, 146, 66 + i * 28, 1.6, '#3D2A1C');
    line(c, 44 + i * 17, 46, 42 + i * 17, 222, 1.4, '#3D2A1C');
  }
  c.globalAlpha = 1;
  // A child's face peeks out of the top opening.
  pigment(c, oval(90, 94, 24, 27), [64, 66, 52, 56], ['#8F7453', '#AE8A65', '#6A5741'], 3806, 140, 0, .4);
  daub(c, 82, 92, 5, 2, 0, '#241D18', r); daub(c, 98, 92, 5, 2, 0, '#241D18', r);
  daub(c, 90, 101, 7, 1.4, 0, '#5E4034', r);
  daub(c, 90, 220, 112, 14, .02, '#D8C49A', r);
  pigment(c, rectangle(24, 128, 14, 76), [22, 126, 18, 80], ['#A88E68', '#C6AA7D'], 3804, 55, -1.5, .3);
  pigment(c, rectangle(142, 128, 14, 76), [140, 126, 18, 80], ['#A88E68', '#C6AA7D'], 3805, 55, -1.5, .3);
  pigment(c, rectangle(64, 218, 20, 26), [64, 218, 20, 26], ['#A88E68', '#C6AA7D'], 3807, 45, -1.5, .3);
  pigment(c, rectangle(96, 218, 20, 26), [96, 218, 20, 26], ['#A88E68', '#C6AA7D'], 3808, 45, -1.5, .3);
  daub(c, 74, 244, 20, 5, .02, '#2A2B25', r); daub(c, 106, 244, 20, 5, .02, '#2A2B25', r);
});

/* ---------------- small props ---------------- */
export const paintDoll = () => makePaint(90, 170, c => {
  const r = random(3901);
  pigment(c, oval(45, 42, 20, 24), [22, 16, 46, 50], ['#C9BE9C', '#E1D7B6', '#958F76'], 3902, 110, 0, .4);
  pigment(c, polygon([[20, 80], [26, 58], [45, 52], [64, 58], [70, 80], [66, 142], [54, 158],
    [36, 158], [24, 142]]), [18, 50, 54, 110], ['#BDB391', '#D6CBA8', '#8E8B73'], 3903, 180, -1.5, .4);
  daub(c, 37, 40, 4, 1.6, .02, '#3A3730', r); daub(c, 53, 40, 4, 1.6, .02, '#3A3730', r);
  line(c, 45, 76, 45, 140, 2, '#8E8B73');
  line(c, 30, 110, 60, 110, 2, '#8E8B73');
});
export const paintWatch = () => makePaint(100, 100, c => {
  pigment(c, oval(50, 50, 36, 36), [12, 12, 76, 76], ['#C7A257', '#E8C87D', '#8C6A35'], 3910, 220, 0, .4);
  pigment(c, oval(50, 50, 25, 25), [24, 24, 52, 52], ['#E9DEC0', '#CFC19E'], 3911, 80, 0, .3);
  line(c, 50, 50, 50, 30, 3, '#4E4230');
  line(c, 50, 50, 64, 58, 3, '#4E4230');
  c.strokeStyle = '#B38F4B'; c.lineWidth = 3;
  c.beginPath(); c.arc(50, 50, 31, 0, Math.PI * 2); c.stroke();
});
export const paintPennies = () => makePaint(140, 60, c => {
  const r = random(3920);
  for (let i = 0; i < 5; i++) {
    pigment(c, oval(24 + i * 22, 26 + (i % 2) * 8, 14, 12), [10 + i * 22, 12, 28, 28],
      ['#B98A45', '#D8AC62', '#8A6531'], 3921 + i, 60, 0, .3);
  }
  daub(c, 65, 26, 50, 3, .02, '#A77F45', r);
});
export const paintGum = () => makePaint(80, 50, c => {
  pigment(c, rectangle(8, 12, 64, 26), [8, 12, 64, 26], ['#D7C8A4', '#EADDBB', '#9E9277'], 3930, 80, 0, .3);
  daub(c, 40, 25, 42, 3, .02, '#8C6E4A', random(3931));
});
export const paintBird = () => makePaint(260, 190, c => {
  const r = random(3940);
  // Long tail, rounded body, raised head: a mockingbird rather than a blob.
  pigment(c, polygon([[112, 94], [28, 156], [18, 172], [70, 140], [108, 112]]), [10, 90, 110, 90],
    ['#5E6259', '#828577', '#3E4644'], 3941, 220, -.3, .4);
  pigment(c, oval(118, 100, 58, 38), [56, 60, 124, 84], ['#8B8B7C', '#B8B7A4', '#5F6259', '#D8D5C2'], 3942, 420, -.15, .5);
  pigment(c, oval(172, 74, 25, 24), [146, 48, 54, 52], ['#9A9A88', '#C3C1AC', '#6B6E62'], 3943, 160, 0, .4);
  pigment(c, polygon([[196, 72], [226, 78], [196, 88]]), [192, 70, 38, 22], ['#C6A25C', '#E4C17B', '#8E6B36'], 3944, 50, -.1, .3);
  daub(c, 180, 70, 6, 6, 0, '#22241F', r);
  // Wing and two white bars.
  pigment(c, polygon([[84, 80], [140, 62], [176, 92], [118, 110]]), [80, 60, 100, 54],
    ['#565D59', '#7E8277', '#3E4644'], 3945, 160, -.2, .4);
  daub(c, 122, 84, 48, 5, -.2, '#DFDCC8', r);
  daub(c, 146, 96, 42, 4, -.15, '#CFCBB6', r);
  // Legs and feet on the branch.
  line(c, 126, 134, 118, 168, 3, '#4A4A40');
  line(c, 144, 134, 150, 168, 3, '#4A4A40');
  line(c, 110, 168, 126, 168, 2.4, '#4A4A40');
  line(c, 142, 168, 158, 168, 2.4, '#4A4A40');
});
export const paintFeather = () => makePaint(80, 180, c => {
  const r = random(3950);
  const f = new Path2D('M40 8Q68 56 58 124Q52 154 40 170Q24 136 20 100Q22 48 40 8Z');
  pigment(c, f, [14, 4, 60, 172], ['#D7D2BC', '#F0EBD8', '#9E9C89'], 3951, 240, -1.5, .4);
  line(c, 40, 14, 38, 168, 2.2, '#7C7A6A');
  for (let i = 0; i < 14; i++) {
    const y = 26 + i * 10;
    daub(c, 39 + Math.sin(i) * 3, y, 28 - i, 1.2, 1.2, '#B9B5A0', r);
  }
});
export const paintLantern = () => makePaint(100, 170, c => {
  pigment(c, rectangle(28, 38, 44, 90), [28, 38, 44, 90], ['#D7B268', '#F0D28C', '#8F6D36'], 3960, 160, -1.5, .4);
  line(c, 50, 80, 50, 122, 6, '#4A3E2C');
  line(c, 50, 80, 28, 80, 28, '#4A3E2C'); line(c, 50, 80, 72, 80, 28, '#4A3E2C');
  pigment(c, polygon([[24, 38], [76, 38], [64, 16], [36, 16]]), [22, 14, 56, 26], ['#6C5335', '#8F6D42'], 3961, 70, 0, .3);
  pigment(c, rectangle(26, 126, 48, 24), [26, 126, 48, 24], ['#6C5335', '#8F6D42'], 3962, 70, 0, .3);
  glaze(c, 50, 82, 98, '#F4CD7A', .5);
});
export const paintOpenBook = () => makePaint(660, 380, c => {
  const r = random(3970);
  // Leather binding with a visible border around the paper block.
  c.fillStyle = '#4B3223'; c.fillRect(0, 0, 660, 380);
  for (let i = 0; i < 120; i++) {
    daub(c, r() * 660, r() * 380, 14 + r() * 42, 3 + r() * 7, r() * 3.14,
      i % 3 ? '#5A3D29' : '#775238', r);
  }
  const left = new Path2D('M14 44Q42 34 160 22L320 8L336 370L16 380Z');
  const right = new Path2D('M342 8L506 22Q602 32 646 44L644 380L342 370Z');
  c.fillStyle = '#D6C49A'; c.fill(left);
  c.fillStyle = '#DCCBA2'; c.fill(right);
  // Soft paper grain, never broad horizontal wood strokes.
  c.globalAlpha = .35;
  for (let i = 0; i < 150; i++) {
    daub(c, 24 + r() * 600, 30 + r() * 330, 8 + r() * 22, 1 + r() * 1.6,
      (r() - .5) * .5, i % 4 ? '#C5B183' : '#EEE0BC', r);
  }
  c.globalAlpha = 1;
  // Text is thin ink, not a field of wood grain.
  const ink = 'rgba(88,73,50,.5)';
  for (let i = 0; i < 13; i++) {
    const w = i === 11 ? 126 : 186 + r() * 66;
    line(c, 58, 94 + i * 18, 58 + w, 94 + i * 18, 1.4, ink);
    line(c, 386, 92 + i * 18, 386 + (i === 12 ? 116 : 178 + r() * 66), 92 + i * 18, 1.4, ink);
  }
  line(c, 64, 62, 184, 62, 3.1, 'rgba(80,64,42,.6)');
  line(c, 396, 60, 536, 60, 3.1, 'rgba(80,64,42,.6)');
  // Page block, gutter shadow and a red silk bookmark.
  c.strokeStyle = 'rgba(108,92,66,.7)'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(332, 12); c.lineTo(332, 372); c.stroke();
  daub(c, 332, 194, 22, 354, 1.57, 'rgba(78,66,48,.6)', r);
  c.globalAlpha = .4;
  for (let i = 0; i < 9; i++) daub(c, 12, 70 + i * 32, 5, 20, 1.57, '#8F7E5C', r);
  c.globalAlpha = 1;
  c.fillStyle = '#8F2F32'; c.fillRect(300, 0, 20, 58);
  c.fillStyle = '#B14A44'; c.fillRect(302, 0, 16, 54);
});
export const paintTurnPage = () => makePaint(300, 350, c => {
  const r = random(3980);
  const page = new Path2D('M0 22Q140 4 288 0L300 330L0 350Z');
  c.fillStyle = '#DCCBA2'; c.fill(page);
  c.globalAlpha = .32;
  for (let i = 0; i < 60; i++) {
    daub(c, 10 + r() * 280, 12 + r() * 330, 8 + r() * 20, 1 + r() * 1.5,
      (r() - .5) * .3, i % 3 ? '#C6B184' : '#EEE0BC', r);
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 12; i++) {
    line(c, 34, 58 + i * 21, 34 + 186 + r() * 56, 58 + i * 21, 1.3, 'rgba(88,73,50,.48)');
  }
});
export const paintMug = () => makePaint(110, 130, c => {
  pigment(c, rectangle(24, 26, 54, 84), [24, 26, 54, 84], ['#8A785C', '#B09B77', '#5F5748'], 3990, 160, -1.5, .5);
  pigment(c, oval(51, 30, 27, 10), [24, 18, 54, 24], ['#4A4033', '#6B5A44'], 3991, 60, 0, .3);
  c.strokeStyle = '#6B5C46'; c.lineWidth = 9;
  c.beginPath(); c.arc(84, 68, 18, -1.2, 1.2); c.stroke();
  glaze(c, 51, 52, 64, '#D9B26A', .1);
});
