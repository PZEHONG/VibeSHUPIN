/** Procedural paint, made locally in the renderer. No bitmap assets or network.
 * Fixed-seed brush marks are part of each object, so they move with the paint.
 */
type Ctx = CanvasRenderingContext2D;
export const random = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const shade = (hex: string, delta: number) => {
  const n = parseInt(hex.slice(1), 16);
  const channels = hex.startsWith('#') ? [16, 8, 0].map(s => (n >> s) & 255)
    : hex.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  return `rgb(${channels.map(v => Math.max(0, Math.min(255, v + delta))).join(',')})`;
};
const mix = (a: string, b: string, t: number) => {
  const channels = (v: string) => v.startsWith('#') ? [16,8,0].map(s => (parseInt(v.slice(1),16)>>s)&255)
    : v.match(/[\d.]+/g)!.slice(0,3).map(Number);
  const aa=channels(a), bb=channels(b);
  return `rgb(${aa.map((v,i)=>Math.round(v+(bb[i]-v)*t)).join(',')})`;
};
export const polygon = (points: number[][]) => {
  const p = new Path2D(); points.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p;
};
export const rectangle = (x: number, y: number, w: number, h: number) => {
  const p = new Path2D(); p.rect(x, y, w, h); return p;
};
// Broken, overlapping strokes with a dark load and a light bristle ridge.
export const daub = (c: Ctx, x: number, y: number, length: number, width: number,
  angle: number, color: string, r: () => number) => {
  c.save(); c.translate(x, y); c.rotate(angle);
  c.fillStyle = shade(color, -7);
  c.beginPath(); c.moveTo(-length*.52, -width*.3);
  c.quadraticCurveTo(-length*.1, -width*.55, length*.4, -width*.35);
  c.quadraticCurveTo(length*.59, -width*.12, length*.48, width*.2);
  c.quadraticCurveTo(length*.1, width*.48, -length*.45, width*.35);
  c.quadraticCurveTo(-length*.55, width*.08, -length*.52, -width*.3); c.fill();
  c.fillStyle = color; c.beginPath(); c.moveTo(-length*.43, -width*.22);
  c.quadraticCurveTo(0, -width*.46, length*.46, -width*.18);
  c.lineTo(length*.35, width*.2); c.quadraticCurveTo(0, width*.27, -length*.4, width*.25); c.fill();
  for (let j = 0; j < 3; j++) {
    const yy = (r()-.5)*width*.8;
    c.strokeStyle = shade(color, j%2 ? -10 : 19); c.globalAlpha *= .38;
    c.lineWidth = .45 + r()*.8; c.beginPath();
    c.moveTo(-length*(.25+r()*.2), yy);
    c.quadraticCurveTo(0, yy-width*.13, length*(.23+r()*.2), yy+r()*1.8); c.stroke();
  }
  c.restore();
};
export const pigment = (c: Ctx, path: Path2D, box: number[], colors: string[], seed: number,
  count = 400, angle = 0, brush = 1) => {
  const [x, y, w, h] = box, r = random(seed);
  c.save(); c.clip(path);
  // A continuous underpainting supplies form. Small marks vary around the LOCAL
  // colour, rather than choosing unrelated high-contrast chips across the plane.
  const base = c.createLinearGradient(x,y,x+w*.75,y+h);
  base.addColorStop(0,mix(colors[0],'#233F58',.28));
  base.addColorStop(.48,colors[0]);
  base.addColorStop(1,mix(colors[0],'#142C40',.4));
  c.fillStyle=base; c.fillRect(x,y,w,h);
  const field = (xx:number, yy:number) => {
    const wave = Math.sin(xx*5+yy*2+seed)*.5+Math.sin(yy*6-xx*2)*.3;
    const local = mix(colors[0], colors[1] || colors[0], Math.max(0,.22+wave*.28));
    return mix(local, '#17364D', Math.max(0,yy*.25-xx*.06));
  };
  const alpha=c.globalAlpha;
  // Broad scumbles first, then medium directional strokes, then fine pigment.
  for (let pass=0;pass<3;pass++) {
    const n=Math.floor(count*[.16,.62,.42][pass]);
    for (let i=0;i<n;i++) {
      const xx=r(), yy=r(), flow=Math.sin(xx*5+yy*4+seed)*.24;
      const size=pass===0 ? 3.8 : pass===1 ? 1 : .34;
      c.globalAlpha=alpha*(pass===0 ? .22 : pass===1 ? .66 : .35);
      const local=field(xx,yy);
      const col=mix(local,colors[Math.floor(r()*colors.length)],pass===0 ? .24 : .3);
      daub(c,x+xx*w,y+yy*h,(18+r()*62)*brush*size,(2+r()*7)*brush*size,
        angle+flow+(r()-.5)*.25,shade(col,(r()-.5)*(pass===2 ? 30 : 19)),r);
    }
  }
  c.restore();
};

/** Static transparent glazes shape space; illumination stays attached to paint. */
export const glaze = (c: Ctx, x: number, y: number, radius: number, color: string, strength: number) => {
  c.save(); const light=c.createRadialGradient(x,y,0,x,y,radius);
  light.addColorStop(0,color); light.addColorStop(1,'transparent');
  c.globalAlpha=strength; c.fillStyle=light; c.fillRect(0,0,1080,1920); c.restore();
};
export const makePaint = (w: number, h: number, draw: (c: Ctx) => void, finish = true) => {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const c = canvas.getContext('2d')!; draw(c);
  if (finish && w===1080 && h===1920) {
    glaze(c,540,820,1000,'#071C31',.12);
    glaze(c,1050,1800,820,'#071722',.45);
    glaze(c,-100,1500,600,'#081C2C',.22);
  }
  return canvas.toDataURL('image/png');
};
// Compose in portrait coordinates; objects keep their own aspect ratio. The
// scene reaches all four video edges, including the region below the subtitles.
export const paintCorridor = () => makePaint(1080, 1920, c => {
  pigment(c, rectangle(0, 0, 1080, 1920), [0, 0, 1080, 1920], ['#726B4A', '#7D7957', '#5E6551'], 91, 3500, -.1, 1.6);
  pigment(c, polygon([[0, 0], [578, 430], [578, 1090], [0, 1920]]), [0, 0, 578, 1920],
    ['#8B754D', '#A18A5C', '#71644B', '#B29A6A'], 93, 2900, -1.5);
  pigment(c, polygon([[1080, 0], [578, 430], [578, 1090], [1080, 1920]]), [578, 0, 502, 1920],
    ['#4B5749', '#59624B', '#3C4C44', '#737252'], 97, 2200, -1.4);
  pigment(c, polygon([[0, 1920], [578, 1090], [1080, 1920]]), [0, 1090, 1080, 830],
    ['#8C7953', '#9E8F65', '#B19D71', '#6B6C50'], 101, 2500, -.1);
  // Receding arches belong to the painted plate; a near door moves over them.
  for (const [x, y, s] of [[550, 655, .65], [405, 510, 1.05], [170, 180, 1.7]]) {
    const p = new Path2D(); p.moveTo(x-72*s, y+350*s); p.lineTo(x-72*s, y+69*s);
    p.bezierCurveTo(x-74*s, y-38*s, x+74*s, y-38*s, x+72*s, y+69*s);
    p.lineTo(x+72*s, y+350*s); p.closePath();
    pigment(c, p, [x-90*s, y-40*s, 180*s, 410*s], ['#343E36', '#263A33', '#454E3A'], 30+x, 260, -1.57, s);
    c.strokeStyle = '#C4A26E'; c.lineWidth = 12*s; c.stroke(p);
    c.strokeStyle = '#766448'; c.lineWidth = 4*s; c.stroke(p);
  }
  // Loose floor strokes follow the vanishing point.
  const r = random(112);
  for (let i = 0; i < 210; i++) {
    const x = r()*1080, y = 1130+r()*790;
    daub(c, x, y, 30+r()*85, 3+r()*5, Math.atan2(y-1090, x-578), '#B7A77C', r);
  }
});

export const paintDoor = () => makePaint(300, 680, c => {
  const arch = new Path2D('M28 660V160C28-15 272-15 272 160V660Z');
  pigment(c, arch, [15, 0, 275, 680], ['#C1A16C', '#AC8B55', '#D1B57E'], 131, 900, -1.57, .8);
  const inner = new Path2D('M60 660V163C60 30 240 30 240 163V660Z');
  pigment(c, inner, [60, 45, 180, 615], ['#2D413A', '#3C5143', '#4F5D45', '#263A35'], 133, 670, -1.57, .8);
  pigment(c, rectangle(145, 110, 7, 550), [145, 110, 7, 550], ['#A18754', '#7B7147'], 135, 100, -1.57, .5);
  daub(c, 172, 395, 12, 12, 0, '#D8B763', random(137));
  // The same painted “一” plaque returns with the door after each loop.
  pigment(c, rectangle(121, 200, 58, 48), [121, 200, 58, 48], ['#DCC69B', '#E9D7AF'], 139, 65, 0, .25);
  daub(c, 150, 224, 32, 5, -.02, '#665437', random(141));
});

export const paintFigure = () => makePaint(170, 300, c => {
  const p = new Path2D('M65 53C48 41 52 12 70 8C92 1 109 21 102 40L94 56Q100 65 114 73Q124 106 128 145L138 187Q137 200 126 199L111 160L116 207L107 287Q111 297 88 294L79 219L66 289Q62 298 44 291L54 210Q42 208 40 192L47 124Q42 87 57 73L69 65Z');
  pigment(c, p, [28, 0, 115, 300], ['#152D3E', '#274957', '#3D595A', '#746D4C'], 151, 530, -1.48, .45);
  const r=random(153);
  const face=new Path2D('M72 21Q86 15 95 26L97 39L91 42L88 52L75 48L70 37Z');
  pigment(c,face,[69,16,30,39],['#8B8563','#B9AA7C','#586460'],152,90,1.5,.12);
  daub(c,86,32,8,1.8,.03,'#243D46',r);
  daub(c,92,38,5,2,1.4,'#C4B184',r);
  daub(c,90,45,6,1.3,-.08,'#495A52',r);
  daub(c,98,94,47,3,1.25,'#7E8D81',r);
  for(let i=0;i<9;i++) daub(c,62+i*5,113+i*6,36+r()*22,1.2,1.4+(r()-.5)*.25,'#476271',r);
  daub(c,92,242,60,3,1.62,'#52717C',r);
});

export const paintWorkshop = () => makePaint(1080, 1920, c => {
  pigment(c, rectangle(0, 0, 1080, 1920), [0, 0, 1080, 1920],
    ['#534B36', '#61543B', '#403F32', '#78613E'], 211, 4000, -.12, 1.6);
  pigment(c, rectangle(105, 100, 230, 790), [105, 100, 230, 790],
    ['#A39365', '#B3A276', '#877F56', '#C0AF7E'], 213, 950, -1.5);
  for (const x of [112, 220, 320]) pigment(c, rectangle(x, 100, 12, 790), [x, 100, 12, 790], ['#554E37', '#766745'], 215+x, 120, -1.5);
  for (const y of [110, 490, 875]) pigment(c, rectangle(100, y, 240, 14), [100, y, 240, 14], ['#554E37', '#766745'], 218+y, 85, 0);
  pigment(c, polygon([[0, 1430], [490, 1240], [1080, 1430], [1080, 1920], [0, 1920]]), [0, 1240, 1080, 680],
    ['#5B4932', '#6E5438', '#806342', '#4A4131'], 219, 1900, -.1);
  for (const x of [150, 855]) pigment(c, polygon([[x, 1290], [x+74, 1280], [x+90, 1830], [x+24, 1830]]), [x, 1280, 100, 550],
    ['#41392B', '#564330', '#6F5335'], 221+x, 360, -1.5);
  pigment(c, polygon([[0, 1160], [972, 1110], [1080, 1250], [0, 1360]]), [0, 1110, 1080, 250],
    ['#8F663E', '#AC7D49', '#B18B55', '#634B31'], 220, 1050, -.08);
  pigment(c, polygon([[0, 1360], [1080, 1250], [1080, 1370], [0, 1490]]), [0, 1250, 1080, 240],
    ['#4A3B2B', '#5D452D', '#725435'], 225, 450, -.07);
  // Warm light around the crucible, laid in with orange pigment.
  const r = random(230);
  for (let i = 0; i < 100; i++) daub(c, 770+(r()-.5)*210, 1190+r()*75,
    12+r()*38, 4+r()*12, -.1, ['#B88842', '#D3A34D', '#886139'][i%3], r);
});

export const paintFish = () => makePaint(350, 200, c => {
  const shape = new Path2D('M43 101C87 16 200 18 258 83L331 35L309 104L331 167L260 127C201 184 98 181 43 101Z');
  pigment(c, shape, [40, 15, 295, 173], ['#B98A39', '#D7AF50', '#E8CA73', '#91642D', '#C5973C'], 251, 780, -.2, .55);
  c.strokeStyle = '#F0D794'; c.lineWidth = 3;
  for (let i = 0; i < 5; i++) {c.beginPath(); c.moveTo(118+i*22, 65); c.quadraticCurveTo(145+i*22, 106, 112+i*22, 143); c.stroke();}
  daub(c, 88, 87, 11, 10, 0, '#322D24', random(253));
  daub(c, 147, 60, 60, 5, -.08, '#F1D88A', random(255));
});

export const paintPot = () => makePaint(260, 250, c => {
  const p = new Path2D('M22 53Q125 5 238 53L204 208Q126 245 57 205Z');
  pigment(c, p, [20, 20, 222, 216], ['#514B36', '#6B6141', '#84764A', '#3F4031'], 271, 500, -1.3, .6);
  const r = new Path2D(); r.ellipse(130, 55, 106, 30, 0, 0, Math.PI*2);
  pigment(c, r, [20, 22, 222, 66], ['#282D27', '#3D392A', '#6C552C'], 273, 180, 0, .5);
});

export const paintRainBackground = () => makePaint(1080, 1920, c => {
  pigment(c, rectangle(0, 0, 1080, 1920), [0, 0, 1080, 1920],
    ['#234866', '#3C7193', '#172E52', '#628C9E'], 311, 4700, -.2, 1.5);
  pigment(c, polygon([[0, 70], [300, 140], [650, 40], [1080, 200], [1080, 340], [420, 270], [0, 390]]), [0, 40, 1080, 350],
    ['#315D7D', '#527E98', '#263C66'], 313, 1100, -.08, 1.8);
  pigment(c, polygon([[0, 1210], [495, 1120], [1080, 1210], [1080, 1920], [0, 1920]]), [0, 1120, 1080, 800],
    ['#163D59', '#376D86', '#416D79', '#102A46'], 350, 3000, -.05);
  const r = random(355);
  c.globalAlpha=.32;
  for (let i = 0; i < 470; i++) daub(c, r()*1080, 1200+r()*720, 15+r()*100,
    1+r()*4, -.02, ['#4F8499', '#3E6579', '#153B58', '#72979C'][i%4], r);
  c.globalAlpha=1;
  for (const x of [140,412,701,959]) {
    for (let j=0;j<80;j++) {
      const yy=1220+r()*660, spread=18+(yy-1220)*.08;
      c.globalAlpha=.12+r()*.3;
      daub(c,x+(r()-.5)*spread*2,yy,8+r()*spread,1+r()*4,.02,
        ['#C6A850','#D5BD68','#8E945D'][j%3],r);
    }
  }
  c.globalAlpha=1;
});

export const paintRainShore = () => makePaint(1080, 1920, c => {
  // A small street, reflected in water. Each house has its own loaded brush.
  const houses = [[-20, 710, 270, 470], [250, 590, 285, 600], [590, 660, 250, 540], [830, 790, 280, 400]];
  houses.forEach(([x, y, w, h], i) => {
    pigment(c, polygon([[x, y+48], [x+w*.47, y-40], [x+w, y+48], [x+w, y+h], [x, y+h]]), [x, y-40, w, h+40],
      ['#69776E', '#A59A70', '#416471', '#C4B67D'], 320+i, 750, -1.5);
    // A shaded return wall gives each house thickness and a common light direction.
    pigment(c, polygon([[x+w*.83,y+18],[x+w,y+48],[x+w,y+h],[x+w*.83,y+h-28]]),
      [x+w*.83,y+18,w*.17,h], ['#354F58','#526B6A','#263E4E'], 325+i, 220, -1.5, .6);
    const edge = random(390+i);
    for (let j=0;j<28;j++) {
      const yy=y+80+edge()*(h-100);
      daub(c,x+w*(.84+edge()*.15),yy,9+edge()*18,2,.14,'#758579',edge);
    }
    pigment(c, polygon([[x-12, y+55], [x+w*.47, y-60], [x+w+16, y+55], [x+w-4, y+78], [x+w*.47, y-23], [x+4, y+83]]), [x-12, y-60, w+30, 150],
      ['#554F42', '#725C45', '#46504A'], 330+i, 180, -.1, .75);
    for (const xx of [x+w*.16, x+w*.64]) pigment(c, rectangle(xx, y+170, w*.19, 125), [xx, y+170, w*.19, 125],
      ['#BCA354', '#E8CB78', '#776A43'], 340+i+xx, 115, -1.5, .4);
    for (const xx of [x+w*.16,x+w*.64]) glaze(c,xx+w*.095,y+230,160,'#E6BD5F',.17);
    const detail=random(360+i);
    c.save();
    c.strokeStyle='#314E5B'; c.lineWidth=4;
    for(const xx of [x+w*.16,x+w*.64]) {
      c.strokeRect(xx-5,y+165,w*.19+10,135);
      c.beginPath(); c.moveTo(xx+w*.095,y+170);c.lineTo(xx+w*.095,y+295);c.stroke();
      c.beginPath(); c.moveTo(xx,y+228);c.lineTo(xx+w*.19,y+228);c.stroke();
      daub(c,xx+w*.095,y+305,w*.24,7,0,'#A8A181',detail);
    }
    pigment(c,rectangle(x+w*.43,y+h-175,w*.2,175),[x+w*.43,y+h-175,w*.2,175],
      ['#1A3649','#345460','#61746D'],370+i,100,1.57,.3);
    for(let j=0;j<75;j++) {
      const xx=x+detail()*w, yy=y+330+detail()*Math.max(10,h-330);
      daub(c,xx,yy,12+detail()*20,2+detail()*3,0,'#88927C',detail);
    }
    // Short broken strokes follow the two roof pitches.
    for(let j=0;j<55;j++) {
      const t=detail(), side=j%2 ? 1 : -1;
      const xx=x+w*.47+side*t*w*.52, yy=y-40+t*95;
      daub(c,xx,yy,13+detail()*14,3,side*.38,'#827D66',detail);
    }
    c.restore();
  });
}, false);

/** Near foliage gives a separate depth cue, with paint following each leaf. */
export const paintFoliage = () => makePaint(350, 780, c => {
  const r=random(1703);
  for(let branch=0;branch<7;branch++) {
    const bx=20+branch*26, top=70+r()*380;
    c.strokeStyle='#102A35'; c.lineWidth=5;
    c.beginPath(); c.moveTo(bx,800);c.quadraticCurveTo(bx+30,450,bx+100,top);c.stroke();
    for(let j=0;j<11;j++) {
      const y=top+j*42, x=bx+100-(y-top)*.12, sign=j%2 ? 1 : -1;
      const leaf=new Path2D(); leaf.moveTo(x,y);
      leaf.quadraticCurveTo(x+sign*60,y-58,x+sign*90,y-24);
      leaf.quadraticCurveTo(x+sign*45,y+12,x,y);
      pigment(c,leaf,[x-95,y-60,190,80],['#143C42','#36605B','#7A8963'],1800+branch*20+j,23,sign*.4,.4);
    }
  }
});
