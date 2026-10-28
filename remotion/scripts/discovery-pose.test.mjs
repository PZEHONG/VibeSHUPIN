import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {discoveryPose} from '../src/components/discovery-pose.ts';
test('the hand approaches, pauses at the gift, and withdraws', () => {
 const rest=discoveryPose(0), approach=discoveryPose(4), contact=discoveryPose(7.4), held=discoveryPose(8.1), end=discoveryPose(12.9);
 assert.ok(approach.reach>rest.reach); assert.ok(contact.reach>approach.reach);
 assert.ok(contact.fingerCurl>approach.fingerCurl); assert.ok(Math.abs(contact.reach-held.reach)<.02);
 assert.ok(end.reach<contact.reach); assert.ok(end.camera>rest.camera);
});
test('poses are deterministic and bounded across the complete shot', () => {
 for(let t=0;t<=13.3;t+=.1){const p=discoveryPose(t);assert.deepEqual(p,discoveryPose(t));for(const x of Object.values(p)) assert.ok(Number.isFinite(x)&&x>=0&&x<=1);}
});

test('the index fingertip reaches the first carved figure during the hold', async () => {
 const {discoveryHandGeometry} = await import('../src/components/discovery-pose.ts');
 const {tip, target} = discoveryHandGeometry(7.5);
 assert.ok(Math.hypot(tip.x-target.x, tip.y-target.y)<28, `contact gap: ${Math.hypot(tip.x-target.x, tip.y-target.y).toFixed(1)}px`);
});
