import assert from 'node:assert/strict';
import { SKYDIMO_ZONES, edgeSamples, ledBusy, ledColor, ledHue, nextMode, zoneU } from '../src/components/room-lights.ts';

const base = { time: 10, playing: false, note: -1, noteAt: 0, hue: 226, light: false, mode: 'sync', still: false };
const state = (patch) => ({ ...base, ...patch });

assert.equal(SKYDIMO_ZONES, 23);
assert.equal(zoneU(0), 0);
assert.equal(zoneU(SKYDIMO_ZONES - 1), 1);
for (let i = 1; i < SKYDIMO_ZONES; i++) assert.ok(zoneU(i) > zoneU(i - 1), `zoneU increases at ${i}`);

const playing = state({ playing: true, note: 5, noteAt: 9.9 });
for (const s of [base, playing, state({ ambient: [[1, 0, 0], [0, 1, 0]] })]) {
  for (const u of [0, 0.3, 0.77, 1]) assert.deepEqual(ledColor(u, s), ledColor(u, s, [9, 9, 9]));
}

for (const s of [state({ mode: 'off' }), state({ mode: 'off', playing: true, note: 3, noteAt: 10 })]) {
  assert.deepEqual(ledColor(0.4, s), [0, 0, 0]);
}

for (const mode of ['static', 'sync']) {
  const still = mode === 'sync';
  const ref = ledColor(0, state({ mode, still, time: 0 }));
  assert.ok(ref.some((c) => c > 0));
  for (const time of [0, 1.7, 33]) {
    for (const u of [0, 0.5, 1]) {
      assert.deepEqual(ledColor(u, state({ mode, still, time, playing: true, note: 7, noteAt: time - 0.1 })), ref, `${mode} constant`);
    }
  }
}
const lightStatic = ledColor(0.5, state({ mode: 'static', light: true }));
assert.notDeepEqual(lightStatic, ledColor(0.5, state({ mode: 'static' })));

const before = state({ playing: true, note: 3, noteAt: 9, time: 10 });
const after = state({ playing: true, note: 4, noteAt: 10, time: 10 });
for (const u of [0, 0.5, 1]) assert.notDeepEqual(ledColor(u, before), ledColor(u, after), `new note changes u=${u}`);

const idle = [0, 1.5, 3].map((time) => ledColor(0.5, state({ time })));
assert.notDeepEqual(idle[0], idle[2], 'idle breathes');

assert.equal(ledBusy(state({ mode: 'off' })), false);
assert.equal(ledBusy(state({ mode: 'static' })), false);
assert.equal(ledBusy(state({ still: true })), false);
assert.equal(ledBusy(base), true);

assert.equal(nextMode('sync'), 'static');
assert.equal(nextMode('static'), 'off');
assert.equal(nextMode('off'), 'sync');

for (let note = -1; note <= 40; note++) {
  for (const u of [0, 0.25, 0.5, 0.75, 1]) {
    for (const time of [0, 2, 7.3]) {
      const h = ledHue(u, state({ playing: note >= 0, note, noteAt: time - 0.05, time }));
      assert.ok(h >= 210 && h <= 270, `hue ${h} note ${note}`);
    }
  }
}

const w = 8;
const h = 6;
const px = new Uint8Array(w * h * 4);
const paint = (x, y, rgb) => px.set([...rgb, 255], (y * w + x) * 4);
for (let y = 0; y < h; y++) paint(0, y, [255, 0, 0]);
for (let x = 0; x < w; x++) paint(x, 0, [0, 255, 0]);
for (let y = 0; y < h; y++) paint(w - 1, y, [0, 0, 255]);
const dominant = (c) => c.indexOf(Math.max(...c));
const samples = edgeSamples(px, w, h, 3);
assert.equal(samples.length, 3);
assert.deepEqual(samples.map(dominant), [0, 1, 2]);
for (const c of samples) for (const v of c) assert.ok(v >= 0 && v <= 1);
assert.equal(edgeSamples(px, w, h, SKYDIMO_ZONES).length, SKYDIMO_ZONES);

let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const modes = ['sync', 'static', 'off'];
for (let i = 0; i < 1000; i++) {
  const ambient = rand() < 0.3 ? Array.from({ length: 1 + Math.floor(rand() * 30) }, () => [rand(), rand(), rand()]) : undefined;
  const time = rand() * 1000;
  const s = {
    time,
    playing: rand() < 0.5,
    note: Math.floor(rand() * 50) - 1,
    noteAt: time - rand() * 2,
    hue: rand() < 0.5 ? 226 : rand() * 360,
    light: rand() < 0.5,
    mode: modes[Math.floor(rand() * 3)],
    still: rand() < 0.2,
    ambient,
  };
  const u = rand();
  const c = ledColor(u, s);
  assert.ok(Number.isFinite(ledHue(u, s)));
  for (const v of c) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1.4, `bad ${v}`);
}

console.log('PASS check-lights: zones, sync/static/off, note kick, hue band, edge samples, 1000 random states');
