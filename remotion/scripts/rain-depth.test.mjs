import test from 'node:test';
import assert from 'node:assert/strict';
import {rainDepth} from '../src/components/oilMotion.ts';

test('rain depth layers move smoothly at distinct rates and seek deterministically', () => {
  const start = rainDepth(0), end = rainDepth(1);
  assert.notEqual(end.near.x - start.near.x, end.shore.x - start.shore.x);
  assert.notEqual(end.figure.x - start.figure.x, end.shore.x - start.shore.x);
  for (let i = 0; i <= 600; i++) {
    const p = i / 600, current = rainDepth(p);
    assert.deepEqual(rainDepth(p), current);
    if (i) for (const name of ['shore', 'figure', 'near']) {
      const previous = rainDepth((i-1)/600)[name];
      assert.ok(Math.abs(current[name].x-previous.x) < 1);
      assert.ok(Math.abs(current[name].y-previous.y) < 1);
    }
  }
});
