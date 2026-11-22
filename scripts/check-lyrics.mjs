import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLrc, lineAt, lineAtTime, wordsSung } from '../src/components/vinyl-lyrics.ts';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const lyrics = parseLrc('[ar:Test]\n[offset:+500]\n[00:01.50]first\n\n[00:03.00][00:10.25]chorus\r\n[00:05:20]  \nno stamp\n[01:02.5]last');
assert.deepEqual(lyrics.map((l) => [l.t, l.text]), [[1, 'first'], [2.5, 'chorus'], [4.7, ''], [9.75, 'chorus'], [62, 'last']]);
assert.equal(lineAt(lyrics, 0.99), -1);
assert.equal(lineAt(lyrics, 1), 0);
assert.equal(lineAt(lyrics, 4.69), 1);
assert.equal(lineAt(lyrics, 4.7), 2);
assert.equal(lineAt(lyrics, 100), 4);
assert.equal(lineAt([], 3), -1);
assert.deepEqual(parseLrc('[offset:-1000]\n[00:00.00]a').map((l) => l.t), [1]);

const [tagged, repeat] = parseLrc('[00:05.00]<00:05.00>Pave <00:05.40>me <00:05.62>a path\n[00:20.00][00:30.00]<00:20.00>Hold <00:21.50>on');
assert.deepEqual(tagged.words, ['Pave', 'me', 'a', 'path']);
assert.equal(tagged.text, 'Pave me a path');
close(tagged.times[0], 5); close(tagged.times[1], 5.4); close(tagged.times[2], 5.62);
assert.ok(tagged.times[3] > 5.62 && tagged.times[3] < 20, 'untagged tail word is estimated after the last tag');
close(repeat.times[1], 21.5);
const again = parseLrc('[00:20.00][00:30.00]<00:20.00>Hold <00:21.50>on')[1];
close(again.t, 30); close(again.times[1], 31.5);

const [plain, next] = parseLrc('[00:10.00]I will beg and steal\n[00:11.00]x');
assert.equal(plain.times[0], 10);
assert.ok(plain.times.every((t, i) => i === 0 || t > plain.times[i - 1]), 'estimated words are increasing');
assert.ok(plain.times.at(-1) < next.t, 'estimated words fit before the next line');
assert.equal(wordsSung(plain, 9.99), 0);
assert.equal(wordsSung(plain, 10), 1);
assert.equal(wordsSung(plain, 10.99), 5);
assert.equal(wordsSung(tagged, 5.5), 2);

// Continuous lines spread their words over the whole slot, so karaoke stays in step with the vocal.
const sung = parseLrc('[00:10.00]one two three four\n[00:14.00]next');
assert.ok(sung[0].times.at(-1) > 12.5, `last word of a continuous line lands near the line end, got ${sung[0].times.at(-1)}`);
assert.ok(sung[0].times.at(-1) < 14, 'words never cross into the next line');
assert.ok(sung[0].times.every((t, i) => i === 0 || t > sung[0].times[i - 1]), 'estimated words stay increasing');

// A short line inside a long musical gap must not crawl over the silence.
const sparse = parseLrc('[00:10.00]hold on\n[00:40.00]next');
assert.ok(sparse[0].times.at(-1) < 12, `a two-word line in a 30 s gap finishes fast, got ${sparse[0].times.at(-1)}`);

// end: the line disappears after its last word instead of hanging over the instrumentation.
assert.ok(sung[0].end <= sung[1].t, 'a line ends before the next line starts');
assert.equal(lineAtTime(sung, 13.99)?.text, 'one two three four');
assert.equal(lineAtTime(sung, 10.5)?.text, 'one two three four');
assert.equal(lineAtTime(sparse, 25), null);
assert.equal(lineAtTime(sparse, 41)?.text, 'next');
assert.equal(lineAtTime([], 3), null);

// The shipped files must stay in the shape the audio needs. Each track is pinned to the stamp baseline measured
// against the encoded side files, so a whole-file drift (the Music Video .lrc started 10.6 s late) fails here.
// ponytail: a single line drifting inside a track is not caught; that needs word tags or an audio-alignment pass.
// It is a regression guard, not proof of sync.
const PINNED = {
  A1: [4.74, 171.36], A2: [12.58, 202.02], A3: [0.58, 301.36],
  B1: [0.23, 223.01], B2: [11.07, 217.79], B3: [4.43, 205.84],
  C1: [16.04, 361.83], C2: [29.47, 147.53], C3: [12.02, 288.45],
  D1: [0.06, 358.47], D2: [13.65, 373.08], D3: [21.37, 389.59],
};
const DRIFT = 2;
for (const [code, [first, last]] of Object.entries(PINNED)) {
  let file;
  try { file = readFileSync(new URL(`../public/media/vinyl/lyrics/${code}.lrc`, import.meta.url), 'utf8'); }
  catch { file = null; }
  if (file === null) continue; // album media is not in a bare checkout; the guard bites once the lyrics are tracked
  const shipped = parseLrc(file).filter((line) => line.text);
  assert.ok(shipped.length > 5, `${code}: has lyric lines`);
  assert.ok(Math.abs(shipped[0].t - first) < DRIFT, `${code}: first line drifted to ${shipped[0].t}s, expected ~${first}s (whole-file offset?)`);
  assert.ok(Math.abs(shipped.at(-1).t - last) < DRIFT, `${code}: last line drifted to ${shipped.at(-1).t}s, expected ~${last}s`);
  assert.ok(shipped.every((line) => line.end > line.t), `${code}: every line has a positive lifetime`);
  assert.ok(shipped.every((line) => line.end <= (shipped.find((l) => l.t > line.t)?.t ?? Infinity)), `${code}: a line never outlives the next one`);
}
console.log('PASS lyrics: lrc parse, repeat stamps, offset, blank lines, lookup bounds, enhanced word tags, word estimate, words sung, line expiry, shipped files');
