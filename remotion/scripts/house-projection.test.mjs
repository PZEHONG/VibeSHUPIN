import test from 'node:test';
import assert from 'node:assert/strict';
import {houseProjection} from '../src/components/oilMotion.ts';

test('house volume has connected faces and perspective changes smoothly', () => {
  for (let i=0;i<4;i++) {
    const first=houseProjection(i,0), last=houseProjection(i,1);
    assert.ok(first.sideWidth > 15 && first.sideWidth < 110);
    assert.ok(first.roofRise > 0);
    assert.notEqual(first.frontX,last.frontX);
    assert.notEqual(first.sideWidth,last.sideWidth);
    for(let f=1;f<=120;f++) {
      const a=houseProjection(i,(f-1)/120), b=houseProjection(i,f/120);
      assert.ok(Math.abs(a.frontX-b.frontX)<1);
      assert.ok(Math.abs(a.sideWidth-b.sideWidth)<1);
      assert.deepEqual(houseProjection(i,f/120),b);
    }
  }
});
