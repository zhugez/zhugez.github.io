import assert from 'node:assert/strict';
import { Keybed } from '../src/components/piano/keybed.ts';
import { computerKey, isBlack, keyLegend, noteName, shiftOctave } from '../src/components/piano/input.ts';

function setup() {
  const log = [];
  const voices = new Map();
  let peak = 0;
  const keybed = new Keybed({
    attack: (m) => {
      log.push(`a${m}`);
      assert.ok(!voices.has(m), `note ${m} must never get a second voice`);
      voices.set(m, true);
      peak = Math.max(peak, voices.size);
    },
    release: (m) => {
      log.push(`r${m}`);
      assert.ok(voices.delete(m), `release of ${m} must end a sounding voice`);
    },
    visual: (m, down) => log.push(`${down ? 'd' : 'u'}${m}`)
  });
  return { keybed, log, voices, peak: () => peak };
}

{
  const { keybed, log, voices } = setup();
  for (const m of [60, 64, 67]) keybed.press('kb', m);
  assert.equal(voices.size, 3);
  for (const m of [60, 64, 67]) keybed.release('kb', m);
  assert.deepEqual(log, ['d60', 'a60', 'd64', 'a64', 'd67', 'a67', 'u60', 'r60', 'u64', 'r64', 'u67', 'r67'], 'chord press and release');
  assert.equal(voices.size, 0);
}

{
  const { keybed, log } = setup();
  assert.equal(keybed.press('kb', 60), true);
  assert.equal(keybed.press('kb', 60), false);
  assert.deepEqual(log, ['d60', 'a60'], 'auto-repeat from the same source is ignored');
}

{
  const { keybed, log } = setup();
  keybed.press('p1', 60);
  keybed.press('midi', 60);
  keybed.release('p1', 60);
  assert.equal(keybed.isDown(60), true);
  keybed.release('midi', 60);
  assert.deepEqual(log, ['d60', 'a60', 'r60', 'a60', 'u60', 'r60'], 'two sources share one key and one voice');
}

{
  const { keybed, log, voices } = setup();
  keybed.setPedal(true);
  keybed.press('kb', 60);
  keybed.release('kb', 60);
  assert.equal(keybed.isSounding(60), true);
  keybed.press('kb', 64);
  keybed.setPedal(false);
  assert.deepEqual(log, ['d60', 'a60', 'u60', 'd64', 'a64', 'r60'], 'sustain holds released notes until the pedal lifts');
  assert.equal(keybed.isSounding(64), true);
  assert.deepEqual([...voices.keys()], [64]);
}

{
  // The key goes down first, then the hammer re-strikes: the old voice is cut immediately before the new attack.
  const { keybed, log, voices, peak } = setup();
  keybed.setPedal(true);
  keybed.press('kb', 60);
  keybed.release('kb', 60);
  keybed.press('kb', 60);
  assert.deepEqual(log, ['d60', 'a60', 'u60', 'd60', 'r60', 'a60'], 're-strikes a sustained note without a second voice');
  assert.equal(voices.size, 1);
  assert.equal(peak(), 1);
}

{
  const { keybed, log } = setup();
  keybed.slide('p7', 60);
  keybed.slide('p7', 60);
  keybed.slide('p7', 62);
  keybed.releaseSource('p7');
  assert.deepEqual(log, ['d60', 'a60', 'u60', 'r60', 'd62', 'a62', 'u62', 'r62'], 'pointer slides across keys and cancels cleanly');
}

{
  const { keybed, log, voices } = setup();
  keybed.setPedal(true);
  keybed.press('a', 60);
  keybed.press('b', 72);
  keybed.release('b', 72);
  keybed.releaseAll();
  assert.equal(keybed.pedal, false);
  assert.equal(keybed.isSounding(60) || keybed.isSounding(72) || keybed.isDown(60), false);
  assert.deepEqual(log.filter((e) => e.startsWith('r')).sort(), ['r60', 'r72'], 'releaseAll clears held, sustained and pedal state');
  assert.equal(voices.size, 0);
}

{
  const { keybed } = setup();
  assert.equal(keybed.press('kb', 20), false);
  assert.equal(keybed.press('kb', 109), false);
  assert.equal(keybed.press('kb', 21), true);
  assert.equal(keybed.press('kb', 108), true);
}

assert.equal(computerKey('KeyA', 60), 60);
assert.equal(computerKey('KeyW', 60), 61);
assert.equal(computerKey('Semicolon', 60), 76);
assert.equal(computerKey('KeyQ', 60), null);
assert.equal(shiftOctave(84, 1), 84);
assert.equal(shiftOctave(24, -1), 24);
assert.equal(shiftOctave(60, 1), 72);
assert.ok(computerKey('Semicolon', 84) <= 108, 'the top octave still fits the 88 keys');
assert.equal(keyLegend(60).length, 17);
assert.deepEqual(keyLegend(60)[16], { key: ';', midi: 76 });
assert.equal(noteName(21), 'A0');
assert.equal(noteName(60), 'C4');
assert.equal(noteName(108), 'C8');
assert.ok([61, 63, 66, 68, 70].every(isBlack));
assert.ok(![60, 62, 64, 65, 67, 69, 71].some(isBlack));

console.log('PASS: keybed chord, repeat, shared sources, sustain, re-strike, slide, releaseAll, range; keyboard mapping, octave clamp, note names.');
