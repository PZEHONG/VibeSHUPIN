/** Fixed-seed plates and props for the complete book-review film. */
import {daub, glaze, makePaint, pigment, polygon, random, rectangle} from './oilPaint';
import type {OilFullSceneType} from '../data/types';

type Ctx = CanvasRenderingContext2D;
const earth = ['#4E554E', '#8F825C', '#B39C68', '#2C4655'];
const wood = ['#70563A', '#967044', '#B99760', '#30414B'];
const cream = ['#B9A781', '#D2BF93', '#9E9577', '#E0CBA1'];
const dark = ['#1B3346', '#355260', '#5B6D6B'];
const oval = (x: number, y: number, rx: number, ry: number) => {
  const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return p;
};
const ground = (c: Ctx, colors: string[], seed: number) =>
  pigment(c, rectangle(0, 0, 1080, 1920), [0, 0, 1080, 1920], colors, seed, 3800, -.08, 1.7);
const beam = (c: Ctx, x: number, y: number, w: number, h: number, seed: number) =>
  pigment(c, rectangle(x, y, w, h), [x, y, w, h], wood, seed, 230, h > w ? -1.5 : 0, .7);

const market = (c: Ctx) => {
  ground(c, ['#284963', '#4F7C94', '#1B3451', '#93A59E'], 501);
  pigment(c, polygon([[0, 0], [510, 540], [510, 1080], [0, 1620]]), [0, 0, 510, 1620], earth, 502, 1800, -1.5);
  pigment(c, polygon([[1080, 0], [610, 540], [610, 1080], [1080, 1620]]), [610, 0, 470, 1620], earth, 503, 1600, -1.5);
  pigment(c, polygon([[0, 1920], [550, 920], [1080, 1920]]), [0, 920, 1080, 1000],
    ['#4B6468', '#A18E60', '#C1AC73', '#253F56'], 504, 2200, -.05);
  // Receding windows break the two uninterrupted geometric facade planes.
  for(const right of [false,true]) for(let row=0;row<3;row++) for(let col=0;col<3;col++) {
    const u=.13+col*.27, xx=right ? 1080-u*470 : u*510;
    const depth=1-u*.75, yy=180+row*220*depth+u*270;
    const ww=80*depth, hh=120*depth;
    const shape=polygon([[xx,yy],[xx+ww,yy+(right ? -1 : 1)*ww*.24],
      [xx+ww,yy+hh],[xx,yy+hh+ww*.12]]);
    pigment(c,shape,[xx,yy-20,ww,hh+40],['#193A50','#3E5C66','#B5A56D'],1900+row*3+col,90,-1.55,.3);
    const rr=random(row*9+col);
    daub(c,xx+ww*.5,yy+hh+4,ww+12,5,right ? -.12 : .12,'#9E9876',rr);
    daub(c,xx+ww*.45,yy+hh*.5,hh,3,1.57,'#8F896A',rr);
  }
  // Awnings, wooden market counters, fruit and hanging lanterns.
  for (const [x, y, w, h] of [[-80, 680, 460, 410], [765, 670, 400, 420]]) {
    pigment(c, polygon([[x, y], [x+w, y+80], [x+w-25, y+230], [x-35, y+140]]), [x-35, y, w+40, 240],
      ['#775B47', '#B08C5C', '#344A54'], 510+x, 650, -.1);
    beam(c, x+30, y+170, 22, h+260, 511+x); beam(c, x+w-40, y+220, 18, h+220, 512+x);
    beam(c, x, y+h, w, 140, 513+x);
    const r = random(515+x);
    for (let i = 0; i < 45; i++) daub(c, x+r()*w, y+h+r()*45, 22, 16, r(), ['#C2A05E', '#776F40', '#B87742'][i%3], r);
  }
  c.strokeStyle = '#3B4233'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(0, 460); c.quadraticCurveTo(540, 750, 1080, 440); c.stroke();
  for (const [x, y, s] of [[150, 540, 1], [450, 608, .7], [750, 570, .8], [1000, 490, 1]]) {
    glaze(c,x,y,190*s,'#E4BB57',.34);
    pigment(c, oval(x, y, 36*s, 56*s), [x-40*s, y-60*s, 80*s, 120*s],
      ['#D4B95F', '#F2DE91', '#AD8844'], 520+x, 90, -1.5, .5);
    daub(c,x-8*s,y,65*s,7*s,1.57,'#F6DF92',random(x));
  }
};

const portraits = (c: Ctx) => {
  ground(c, ['#34434D', '#77674B', '#8A7955', '#243747'], 601);
  pigment(c, polygon([[0, 1920], [580, 970], [1080, 1920]]), [0, 970, 1080, 950], earth, 602, 1900, -.1);
  // Seven related portraits. Each is a painted head and shoulders, not a text label.
  const frames = [[74, 380, 260, 350], [400, 460, 230, 310], [708, 350, 278, 372],
    [120, 840, 210, 282], [425, 875, 195, 263], [726, 822, 220, 298], [451, 194, 168, 216]];
  frames.forEach(([x, y, w, h], i) => {
    pigment(c, rectangle(x-12, y-12, w+24, h+24), [x-12, y-12, w+24, h+24],
      ['#A0834E', '#6F5937', '#BD9A5E'], 610+i, 350, -1.5, .5);
    pigment(c, rectangle(x+6, y+6, w-12, h-12), [x+6, y+6, w-12, h-12], dark, 620+i, 250, -.1, .6);
    pigment(c, oval(x+w*.5, y+h*.34, w*.17, h*.17), [x+w*.3, y+h*.15, w*.4, h*.38],
      ['#A08C67', '#7C7658', '#BC9E73'], 630+i, 100, -1.5, .35);
    pigment(c, polygon([[x+w*.22, y+h*.91], [x+w*.29, y+h*.62], [x+w*.5, y+h*.53],
      [x+w*.72, y+h*.62], [x+w*.83, y+h*.91]]), [x+w*.2, y+h*.52, w*.65, h*.4],
      ['#3E4537', '#555842', '#706848'], 640+i, 170, -1.5, .45);
    daub(c, x+w*.5, y+h*.43, w*.21, h*.014, -.03, '#4B4534', random(650+i));
    const rr=random(660+i);
    daub(c,x+w*.46,y+h*.32,w*.06,2,0,'#2A3C41',rr);
    daub(c,x+w*.56,y+h*.32,w*.06,2,0,'#2A3C41',rr);
    daub(c,x+w*.52,y+h*.37,h*.09,w*.025,1.5,'#C7AE7F',rr);
    daub(c,x+w*.39,y+h*.61,h*.16,w*.045,1.15,'#A49D7E',rr);
  });
};

const dining = (c: Ctx) => {
  ground(c, ['#223746', '#445557', '#80734C', '#162E42'], 701);
  // Rear wall and a single shaft of warm window light.
  pigment(c, rectangle(740, 150, 208, 550), [740, 150, 208, 550], ['#9D9367', '#B1A278', '#7E815D'], 702, 700, -1.5);
  beam(c, 836, 150, 13, 550, 703); beam(c, 740, 400, 208, 12, 704);
  pigment(c, polygon([[0, 1920], [470, 780], [650, 780], [1080, 1920]]), [0, 780, 1080, 1140], earth, 705, 2100, -.08);
  // Seven chairs around one table visually carry the family motif into the ending.
  for (let i = 0; i < 3; i++) {
    const y = 800+i*210, x = 260-i*80, size = .66+i*.16;
    for (const xx of [x, 1080-x-130*size]) {
      beam(c, xx, y, 130*size, 26, 710+i+xx);
      beam(c, xx, y, 14, 210*size, 720+i+xx);
      beam(c, xx+116*size, y, 14, 210*size, 730+i+xx);
      beam(c, xx+50*size, y+20, 12, 150*size, 740+i+xx);
    }
  }
  beam(c, 480, 702, 144, 26, 751); beam(c, 480, 702, 16, 175, 752); beam(c, 608, 702, 16, 175, 753);
  pigment(c, polygon([[375, 800], [702, 800], [985, 1630], [96, 1630]]), [96, 800, 889, 830], wood, 754, 2300, -.05);
  pigment(c, polygon([[96, 1630], [985, 1630], [980, 1725], [102, 1725]]), [96, 1630, 889, 95], ['#3B3328', '#614630'], 755, 400, 0);
  const r = random(756);
  for (let i = 0; i < 7; i++) {
    const y = 910+(i%3)*180, x = i===6 ? 540 : (i<3 ? 350-(i%3)*55 : 725+(i%3)*55);
    pigment(c, oval(x, y, 48, 17), [x-48, y-17, 96, 34], cream, 760+i, 70, 0, .3);
    daub(c, x, y, 60, 3, -.04, '#857954', r);
  }
};

const city = (c: Ctx) => {
  ground(c, ['#183854', '#315F80', '#4D7A91', '#142742'], 801);
  const r = random(802);
  for (let i = 0; i < 16; i++) {
    const x = i*77-30, y = 270+r()*430, w = 61+r()*43;
    pigment(c, rectangle(x, y, w, 1160-y), [x, y, w, 1160-y], ['#253D43', '#384D4D', '#50605B'], 810+i, 330, -1.5);
    for (let yy = y+36; yy < 1100; yy += 52) {
      for (let xx = x+12; xx < x+w-10; xx += 24) if (r() > .43)
        daub(c, xx, yy, 10, 15, 1.5, r()>.4 ? '#B99C61' : '#7E9184', r);
    }
  }
  pigment(c, rectangle(0, 1170, 1080, 750), [0, 1170, 1080, 750], ['#34413B', '#495348', '#5B5D48'], 830, 1800, -.1);
  beam(c, 85, 0, 28, 1280, 831); beam(c, 965, 0, 28, 1280, 832);
  beam(c, 520, 0, 25, 1180, 833); beam(c, 85, 1170, 908, 26, 834);
  // The dining-table reflection links old family silence to the modern room.
  c.globalAlpha = .25;
  pigment(c, polygon([[380, 930], [690, 930], [880, 1310], [210, 1310]]), [210, 930, 670, 380], wood, 835, 500, -.05);
  c.globalAlpha = 1;
};

const apartment = (c: Ctx) => {
  ground(c, ['#445961', '#8A8166', '#294357', '#A29373'], 901);
  pigment(c, rectangle(70, 170, 310, 610), [70, 170, 310, 610], ['#61716B', '#7C8778', '#A29F7D'], 902, 1000, -1.5);
  beam(c, 218, 170, 14, 610, 903); beam(c, 70, 480, 310, 14, 904);
  pigment(c, rectangle(620, 250, 390, 460), [620, 250, 390, 460], ['#5B5E4D', '#76755C', '#9E8C69'], 905, 900, -.1);
  for (const x of [630, 814]) beam(c, x, 250, 12, 460, 906+x);
  pigment(c, rectangle(560, 725, 520, 55), [560, 725, 520, 55], cream, 907, 280, -.08);
  pigment(c, polygon([[0, 1920], [410, 930], [730, 930], [1080, 1920]]), [0, 930, 1080, 990], earth, 908, 2000, -.1);
  pigment(c, polygon([[270, 1070], [820, 1070], [930, 1340], [148, 1340]]), [148, 1070, 782, 270], wood, 909, 1000, -.05);
  beam(c, 205, 1340, 42, 430, 910); beam(c, 816, 1340, 42, 430, 911);
  for (const x of [430, 620]) pigment(c, oval(x, 1200, 62, 23), [x-62, 1177, 124, 46], cream, 912+x, 90, 0, .3);
};

const desk = (c: Ctx) => {
  ground(c, ['#253C4B', '#585849', '#82744D', '#1B3045'], 1001);
  pigment(c, polygon([[0, 260], [390, 340], [1080, 1200], [0, 1600]]), [0, 260, 1080, 1340],
    ['#8B8057', '#A5986A', '#635F43'], 1002, 1800, -.6);
  pigment(c, polygon([[0, 800], [1080, 800], [1080, 1920], [0, 1920]]), [0, 800, 1080, 1120], wood, 1003, 2800, -.05);
  const r = random(1004);
  for (let i = 0; i < 180; i++) daub(c, r()*1080, 850+r()*1050, 40+r()*140, 2+r()*4, -.025, '#B18D59', r);
  pigment(c, oval(850, 680, 90, 22), [760, 658, 180, 44], dark, 1005, 120, 0, .5);
};

export const paintFullPlate = (scene: OilFullSceneType) => makePaint(1080, 1920, c => {
  ({market, portraits, table: dining, city, quarrel: apartment, book: desk, empty_table: dining}[scene])(c);
  if (scene==='table' || scene==='empty_table') {
    glaze(c,840,400,560,'#EBD398',.25);
    glaze(c,549,970,360,'#D4A74E',.22);
  } else if (scene==='market') {
    glaze(c,550,650,630,'#9EBAB8',.18);
    // Street marks converge with depth, rather than covering every plane alike.
    const r=random(1620);
    c.globalAlpha=.24;
    for(let i=0;i<200;i++) {
      const y=1200+r()*720, x=r()*1080;
      daub(c,x,y,12+(y-1100)*.09,2+r()*3,Math.atan2(y-920,x-550),
        i%3 ? '#93A299' : '#DBC180',r);
    }
    c.globalAlpha=1;
  } else if(scene==='book') glaze(c,260,770,650,'#E0C78B',.26);
  else if(scene==='quarrel') glaze(c,220,420,540,'#C8C6A1',.25);
  else if(scene==='portraits') glaze(c,390,620,650,'#C5B786',.2);
  else glaze(c,560,700,780,'#436F96',.16);
});

export const paintArm = () => makePaint(430, 180, c => {
  pigment(c, polygon([[0, 26], [238, 45], [262, 132], [0, 162]]), [0, 26, 265, 136],
    ['#3E4B3D', '#5B614B', '#777554'], 1101, 350, -.05, .65);
  const hand = new Path2D('M234 50L281 50L330 30Q345 25 348 36L318 55L391 50Q409 49 409 59L341 70L412 73Q429 75 423 85L343 87L398 98Q412 102 404 111L333 108L377 126Q390 131 381 141L298 117L253 129Z');
  pigment(c, hand, [230, 22, 198, 125], ['#B3946D', '#D0B183', '#927C5B'], 1102, 350, -.1, .4);
});

export const paintCandle = () => makePaint(120, 320, c => {
  pigment(c, oval(60, 280, 54, 17), [6, 263, 108, 34], wood, 1201, 100, 0, .3);
  beam(c, 53, 191, 14, 90, 1202);
  pigment(c, rectangle(49, 46, 22, 155), [49, 46, 22, 155], cream, 1203, 180, -1.5, .3);
  daub(c, 60, 42, 15, 4, 1.5, '#362E23', random(1204));
});

export const paintChair = () => makePaint(220, 380, c => {
  beam(c, 26, 40, 168, 28, 1301); beam(c, 26, 40, 22, 328, 1302); beam(c, 172, 40, 22, 328, 1303);
  for (const x of [66, 108, 150]) beam(c, x, 64, 12, 162, 1304+x);
  pigment(c, polygon([[23, 230], [192, 230], [214, 278], [6, 278]]), [6, 230, 208, 48], wood, 1308, 230, 0, .4);
});

export const paintBookPage = (cover = false) => makePaint(370, 460, c => {
  const page = polygon([[0, 16], [346, 0], [370, 436], [0, 460]]);
  pigment(c, page, [0, 0, 370, 460], cover ? ['#596448', '#75805A', '#3C503F'] : cream, 1401, 750, -.03, .6);
  if (cover) {
    c.strokeStyle = '#A99560'; c.lineWidth = 3; c.strokeRect(24, 30, 292, 370);
    // Ornament without letters or invented quotations.
    c.strokeStyle = '#B8A46C'; c.beginPath(); c.ellipse(165, 204, 43, 65, 0, 0, Math.PI*2); c.stroke();
  } else {
    const r = random(1402);
    for (let i = 0; i < 22; i++) daub(c, 175, 55+i*15, 170+r()*60, 1.5, -.045, '#8D8262', r);
  }
});
