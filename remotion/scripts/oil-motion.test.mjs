import test from 'node:test';
import assert from 'node:assert/strict';
import {oilCamera} from '../src/components/oilMotion.ts';

const scenes = ['market','portraits','corridor','goldfish','rain','table','city','quarrel','book','empty_table',
  'tkam_town','tkam_porch','tkam_portraits','tkam_boo_house','tkam_tree','tkam_court','tkam_trial',
  'tkam_walk','tkam_night','tkam_boo_porch','tkam_mockingbird','tkam_reading'];
test('all camera paths cover the portrait viewport, including both endpoints', () => {
  for (const scene of scenes) for (let frame=0; frame<=600; frame++) {
    const {scale, x, y} = oilCamera(scene, frame/600);
    const left = 540*(1-scale)+x, top = 960*(1-scale)+y;
    assert.ok(left<=0 && top<=0 && left+1080*scale>=1080 && top+1920*scale>=1920, `${scene}:${frame}`);
  }
});
test('camera seeks reproduce identically and never jump within a shot', () => {
  for (const scene of scenes) {
    const first=oilCamera(scene,.37);
    oilCamera(scene,.9); oilCamera(scene,0);
    assert.deepEqual(oilCamera(scene,.37),first);
    for (let f=1;f<=600;f++) {
      const a=oilCamera(scene,(f-1)/600), b=oilCamera(scene,f/600);
      assert.ok(Math.abs(a.x-b.x)<1 && Math.abs(a.y-b.y)<1 && Math.abs(a.scale-b.scale)<.002);
    }
  }
});
test('last scene settles before the final hold', () => {
  assert.deepEqual(oilCamera('empty_table',.85),oilCamera('empty_table',1));
});
