import assert from 'node:assert/strict';
import { createRig } from '../src/components/room-character.ts';

const NAMES = ['body', 'head', 'leg_l', 'leg_r', 'knee_l', 'knee_r', 'arm_l', 'arm_r', 'elbow_l', 'elbow_r', 'tail_l', 'tail_r'];
const pivots = () => Object.fromEntries(NAMES.map((n) => [n, { rotation: { x: 0, y: 0, z: 0 }, position: { y: n === 'body' ? 0.4 : 0 } }]));
const snapshot = (j) => JSON.stringify(Object.values(j).map((p) => [p.rotation.x, p.rotation.y, p.rotation.z, p.position.y]));
const base = { dt: 1 / 60, now: 0, animate: true, speed: 0, sitting: 0, recline: false, activity: null, keys: 0, keySide: 0, typing: false, playing: false, look: 0 };

function sim(rig, seconds, patch = {}, each) {
  let state, now = patch.now ?? 0;
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    now += 1 / 60;
    state = rig.update({ ...base, ...patch, now });
    each?.(state, now);
  }
  return state;
}

const setup = () => { const joints = pivots(); return { joints, rig: createRig(joints) }; };
const rest = snapshot(pivots());

{
  const { joints, rig } = setup();
  sim(rig, 2, { animate: false, look: 0.5 });
  sim(rig, 1, { animate: false });
  assert.equal(snapshot(joints), rest, 'rest pose restored with animate=false');
  assert.equal(sim(rig, 1, { animate: false }).busy, false);
  assert.equal(rig.trigger('wave'), true);
  assert.equal(sim(rig, 0.1, { animate: false }).busy, false);
  assert.equal(snapshot(joints), rest, 'gesture resolves instantly with animate=false');
}

const amplitude = (speed) => {
  const { joints, rig } = setup();
  let peak = 0;
  sim(rig, 3, { speed }, () => { peak = Math.max(peak, Math.abs(joints.leg_l.rotation.x)); });
  return peak;
};
const walk = amplitude(1), run = amplitude(2);
assert.ok(walk > 0.55 && run > walk && run > 0.8, `walk ${walk} run ${run}`);

{
  const { rig } = setup();
  assert.equal(rig.trigger('jump'), true);
  let peak = 0;
  const end = sim(rig, 1.2, {}, (s) => { peak = Math.max(peak, s.lift); });
  assert.ok(peak > 0.25 && peak < 0.45, `jump peak ${peak}`);
  assert.equal(end.lift, 0);
  sim(rig, 1, { animate: true });
  const seat = setup();
  sim(seat.rig, 0.1, { sitting: 1 });
  assert.equal(seat.rig.trigger('jump'), false);
  assert.equal(sim(seat.rig, 1, { sitting: 1 }).lift, 0);
}

{
  const { joints, rig } = setup();
  sim(rig, 1, { sitting: 1 });
  assert.ok(Math.abs(joints.leg_l.rotation.x + 1.45) < 0.01 && Math.abs(joints.leg_r.rotation.x + 1.45) < 0.01, 'sitting legs');
  const forward = joints.body.rotation.x;
  sim(rig, 2, { sitting: 1, recline: true });
  assert.ok(joints.body.rotation.x < -0.15 && joints.body.rotation.x < forward, `recline ${joints.body.rotation.x}`);
}

{
  const arms = (keys) => {
    const { joints, rig } = setup();
    sim(rig, 1.5, { sitting: 1, activity: 'piano', keys });
    return -(joints.arm_l.rotation.x + joints.arm_r.rotation.x) / 2;
  };
  assert.ok(arms(3) > arms(0) + 0.05, 'piano keys press arms further');
}

for (const g of ['wave', 'water', 'press', 'inspect', 'jump', 'cheer', 'stretch', 'place']) {
  const { joints, rig } = setup();
  sim(rig, 0.1);
  assert.equal(rig.trigger(g), true);
  let moved = 0;
  sim(rig, 0.6, {}, () => { moved = Math.max(moved, Math.abs(joints.arm_r.rotation.x), Math.abs(joints.body.rotation.x), Math.abs(joints.head.rotation.x), Math.abs(joints.body.position.y - 0.4)); });
  assert.ok(moved > 0.01, `${g} moves`);
  sim(rig, 1.4);
  const settled = sim(rig, 0.5, { animate: false });
  assert.equal(snapshot(joints), rest, `${g} returns to rest`);
  assert.equal(settled.busy, false);
}

{
  const { joints, rig } = setup();
  sim(rig, 0.1);
  rig.trigger('wave');
  sim(rig, 0.5);
  assert.ok(Math.abs(joints.arm_r.rotation.x) > 1, 'wave raises arm');
  sim(rig, 0.3, { sitting: 0.2 });
  assert.ok(Math.abs(joints.arm_r.rotation.z) < 0.01, 'sitting change cancels gesture');
}

{
  const { joints, rig } = setup();
  const acts = [null, 'piano', 'computer', 'tv'];
  let seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  let now = 0;
  for (let i = 0; i < 5000; i++) {
    const dt = rnd() < 0.05 ? rnd() * 1e3 : rnd() * 0.1;
    now += dt;
    if (rnd() < 0.02) rig.trigger(['wave', 'water', 'press', 'inspect', 'jump', 'cheer', 'stretch'][Math.floor(rnd() * 7)]);
    const s = rig.update({ dt, now, animate: rnd() > 0.2, speed: Math.floor(rnd() * 3), sitting: rnd(), recline: rnd() > 0.5, activity: acts[Math.floor(rnd() * 4)], keys: Math.floor(rnd() * 12), keySide: rnd() * 2 - 1, typing: rnd() > 0.5, playing: rnd() > 0.5, look: rnd() * 4 - 2 });
    assert.ok(Number.isFinite(s.lift) && Number.isFinite(s.walkPhase) && s.lift <= 0.351, 'finite output');
    for (const p of Object.values(joints)) assert.ok(Math.abs(p.rotation.x) < 4 && Math.abs(p.rotation.y) < 4 && Math.abs(p.rotation.z) < 4 && Math.abs(p.position.y - 0.4) < 1 , `bounded ${JSON.stringify(p)}`);
  }
  const huge = createRig(pivots());
  const s = huge.update({ ...base, dt: 1e9, now: 1e9, speed: 2 });
  assert.ok(s.walkPhase < 1, `dt clamped, phase ${s.walkPhase}`);
  const nan = huge.update({ ...base, dt: NaN, now: NaN, speed: Infinity, sitting: NaN });
  assert.ok(Number.isFinite(nan.walkPhase));
  rig.reset();
  assert.equal(snapshot(joints), rest, 'reset restores rest');
}

console.log('PASS check-character: rest, walk<run, jump arc, sit/recline, piano press, 7 gestures, fuzz, dt clamp');
