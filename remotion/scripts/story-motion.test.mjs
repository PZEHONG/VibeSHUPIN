import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {treeState, courtState} from '../src/components/story-motion.ts';

test('tree action evolves from discovery to sealed opening', () => {
  const a = treeState(0), b = treeState(.42), c = treeState(.98);
  assert.ok(b.reach > a.reach); assert.ok(b.gifts > a.gifts);
  assert.ok(c.seal > b.seal); assert.ok(c.reach < b.reach);
});
test('court testimony and evidence enter at different moments', () => {
  const a = courtState(0), b = courtState(.55), c = courtState(.95);
  assert.ok(b.speaker > a.speaker); assert.ok(c.evidence > b.evidence);
});
import {giftProgress} from '../src/components/story-motion.ts';
test('gifts arrive separately during the narrated discovery', () => {
 assert.ok(giftProgress(.25,0) > giftProgress(.25,3));
 assert.ok(giftProgress(.4,3) > .9);
});
