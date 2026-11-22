import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const session = 'zhugez-music-regression';
const url = process.argv[2] || 'http://127.0.0.1:4321/';
const DECK = 'Audio-Technica AT-LPA2';
const fixture = '[ti:fixture]\n[00:00.20]Fixture line one\n[00:15.00]Fixture line two and now it keeps going well past a single phrase so the split can be proven\n[00:30.00]\n';
const run = (...args) => {
  const response = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 }));
  assert.equal(response.success, true, response.error || args.join(' '));
  return response.data;
};
const evaluate = (source) => {
  // ponytail: a busy machine makes a single CDP eval time out; three tries is enough
  for (let i = 1; ; i++) {
    try { return run('eval', source).result; }
    catch (error) { if (i === 3) throw error; execFileSync('sleep', ['0.5']); }
  }
};
const room = key => evaluate(`document.querySelector('.room').dataset.${key}??''`);
const until = (check, seconds, message) => {
  console.log(`[${Math.round(process.uptime())}s] ${message}`);
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    // a busy machine can make a single CDP eval time out; retry instead of failing
    try { if (check()) return; } catch {}
    execFileSync('sleep', ['0.25']);
  }
  assert.fail(message);
};
const goto = text => evaluate(`(s=>{s.value=[...s.options].find(o=>o.text===${JSON.stringify(text)}).value;s.dispatchEvent(new Event('change',{bubbles:true}));return 1})(document.querySelector('.room-goto select'))`);
const floating = `[...document.querySelectorAll('.music-float .on')].map(e=>e.textContent)`;
const overlaps = `((a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)`;

try {
  run('open');
  run('network', 'route', '**/media/vinyl/lyrics/A1.lrc', '--body', fixture);
  run('open', url);
  run('set', 'viewport', '1440', '960');
  run('set', 'media', 'dark');
  run('open', url);
  until(() => evaluate(`!document.querySelector('.boot')`), 30, 'page boots');
  evaluate(`localStorage.removeItem('zhugez.music.open');document.querySelector('.room').scrollIntoView({block:'center'})`);
  assert.equal(evaluate(`document.querySelectorAll('audio[src*="soft-static"]').length`), 0, 'Soft Static audio is gone');
  assert.equal(evaluate(`!!document.querySelector('.room-play')`), false, 'Soft Static play button is gone');
  assert.equal(evaluate(`document.querySelector('.music-badge').hidden`), true, 'badge stays hidden until a record is on the deck');
  until(() => room('roomState') === 'ready', 120, 'room loads');
  run('click', '.room-enter');
  until(() => room('roomMode') === 'play', 20, 'explore mode opens');

  goto(DECK);
  until(() => room('roomNear') === DECK, 90, 'walks to the empty deck');
  run('press', 'e');
  until(() => /No record on the platter/.test(evaluate(`document.querySelector('.room-card').textContent`)), 10, 'empty deck says there is no record');
  assert.equal(room('roomVinyl'), '');

  goto('Adele · 30 · LP 1');
  until(() => room('roomVinyl') === 'A playing', 150, 'LP 1 is carried to the deck and side A plays');

  until(() => room('roomLyric') === 'Fixture line one', 30, 'first lyric line shows in the room');
  until(() => evaluate(`[...document.querySelectorAll('.music-float span.lyric')].map(e=>e.textContent)`).some(t=>t.startsWith('Fixture line one')), 10, 'first lyric line floats on the page');
  assert.equal(evaluate(`[...document.querySelectorAll('.music-float .lyric')].filter(e=>e.textContent.startsWith('Fixture line one')).length`), 1, 'a short line stays on one floating phrase');
  until(() => evaluate(`[...document.querySelectorAll('.music-float span.lyric.on b.sung')].length`) > 0, 15, 'sung word highlights on the page');
  until(() => room('roomLyric') === 'Fixture line two and now it keeps going well past a single phrase so the split can be proven', 40, 'second lyric line follows the timestamps');
  const split = evaluate(`[...document.querySelectorAll('.music-float .lyric[data-lyric-key="A1:15"]')].sort((a,b)=>Number(a.dataset.lyricChunk)-Number(b.dataset.lyricChunk)).map(e=>e.textContent)`);
  assert.equal(split.length, 3, 'a long lyric splits into exactly three chunks: ' + JSON.stringify(split));
  assert.ok(split.every(t => t.split(' ').length <= 7), 'no floating chunk runs long: ' + JSON.stringify(split));
  assert.equal(split.join(' ').replace(/\s+/g, ' ').trim(), 'Fixture line two and now it keeps going well past a single phrase so the split can be proven', 'the chunks keep every word in order');
  until(() => room('roomLyric') === '', 40, 'blank lrc line clears the lyric');
  assert.equal(evaluate(`[...document.querySelectorAll('.music-float .lyric')].filter(e=>e.textContent.startsWith('Fixture line one')&&e.getAnimations({subtree:true}).length).length`), 0, 'a finished phrase leaves no running animations behind');

  evaluate(`document.querySelector('[data-deck="track-1"]').click()`);
  until(() => evaluate(`document.querySelector('.music-note').textContent`) === 'A2' && room('roomVinyl') === 'A playing', 60, 'deck panel switches to A2');
  for (let i = 0; i < 8; i++) { assert.ok(!room('roomLyric').startsWith('Fixture line'), 'the A1 fixture lyric does not leak into A2'); execFileSync('sleep', ['0.25']); }
  evaluate(`document.querySelector('[data-deck="track-0"]').click()`);
  until(() => room('roomLyric') === 'Fixture line one', 60, 'jumping back to A1 brings its lyrics back');

  run('click', '[data-exit]');
  until(() => room('roomMode') === 'embed', 15, 'leaves explore mode with the record still playing');
  assert.equal(room('roomVinyl'), 'A playing');
  assert.equal(evaluate(`document.querySelector('.music-badge').hidden`), false);
  assert.equal(evaluate(`document.querySelector('.music-badge').classList.contains('is-playing')`), true);
  assert.equal(evaluate(`document.querySelector('.music-record').getAttribute('aria-label')`), 'Vinyl player');
  assert.equal(evaluate(`document.querySelector('.music-note').textContent`), 'A1');
  run('click', '.music-record');
  assert.equal(evaluate(`document.querySelector('.music-options').hidden`), false);
  assert.equal(evaluate(`localStorage.getItem('zhugez.music.open')`), '1');
  assert.equal(evaluate(`document.querySelector('.music-track strong').textContent`), 'Strangers By Nature');
  const seek = (to) => evaluate(`(s=>{s.value='${to}';s.dispatchEvent(new Event('input',{bubbles:true}));return 1})(document.querySelector('.music-seek'))`);
  seek(20);
  until(() => room('roomLyric').startsWith('Fixture line two'), 60, 'badge seek forward lands on the second line');
  seek(0.5);
  until(() => room('roomLyric') === 'Fixture line one', 60, 'badge seek backward brings the first line back');

  run('click', '.music-play');
  until(() => room('roomVinyl') === 'A stopped', 15, 'badge pauses the vinyl');
  until(() => room('roomLyric') === '', 10, 'pausing clears the lyric');
  until(() => !evaluate(floating).length, 15, 'floating lyrics clear after pause');
  assert.equal(evaluate(`[...document.querySelectorAll('.music-float .lyric')].reduce((n,e)=>n+e.getAnimations({subtree:true}).length,0)`), 0, 'pause cancels every lyric animation');
  assert.equal(evaluate(`document.querySelector('.music-badge').classList.contains('is-playing')`), false);

  evaluate(`[...document.querySelectorAll('.music-actions button')].find(b=>b.textContent==='Mute').click()`);
  until(() => evaluate(`[...document.querySelectorAll('.music-actions button')].some(b=>b.textContent==='Unmute')`), 5, 'mute reaches the C7 speakers');
  evaluate(`[...document.querySelectorAll('.music-actions button')].find(b=>b.textContent==='Unmute').click()`);

  run('press', 'Control+k');
  assert.equal(evaluate(`document.querySelector('.music-badge').hidden`), true);
  assert.match(evaluate(`document.body.textContent`), /Play music/);
  run('press', 'Escape');

  run('set', 'viewport', '375', '760');
  assert.equal(evaluate(`document.documentElement.scrollWidth<=innerWidth`), true);
  assert.equal(evaluate(`getComputedStyle(document.querySelector('.music-badge')).position`), 'fixed');
  assert.equal(evaluate(`Math.max(0,...[...document.querySelectorAll('.music-float span.lyric.on')].map(e=>e.getBoundingClientRect().right-innerWidth))`), 0, 'floating lyrics stay within mobile viewport');
  for (const part of ['.music-options', '.music-record']) for (const selector of ['.theme-dock', '[aria-label="Open command palette"]']) {
    assert.equal(evaluate(`${overlaps}(document.querySelector(${JSON.stringify(part)}).getBoundingClientRect(),document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect())`), false, part + ' overlaps ' + selector);
  }
  run('click', '[aria-label="Theme settings"]');
  assert.equal(evaluate(`document.querySelector('.music-options').hidden`), true);
  run('click', '.music-record');
  assert.equal(evaluate(`!!document.querySelector('[aria-label="Accent hue"]')`), false);
  assert.equal(evaluate(`document.querySelector('.music-options').hidden`), false);

  run('set', 'media', 'dark', 'reduced-motion');
  assert.equal(evaluate(`getComputedStyle(document.querySelector('.music-disc')).animationName`), 'none');
  assert.match(evaluate(`(()=>{const f=document.querySelector('.music-float'),s=document.createElement('span');s.className='lyric still on';s.innerHTML='<b>still</b> <b class="sung">word</b>';f.appendChild(s);const cs=getComputedStyle(s),w=getComputedStyle(s.querySelector('b')),u=getComputedStyle(s.querySelector('b.sung'));const out=[cs.animationName,cs.transform,cs.opacity,cs.filter,w.animationName,w.transform,u.animationName,u.transform,/12px/.test(u.textShadow)].join('|');s.remove();return out;})()`), /^none\|none\|0\.96\|none\|none\|none\|none\|none\|true$/, 'reduced motion keeps a still, readable lyric with the sung word lit');
  console.log('PASS: Soft Static removed, empty deck hint, LP carry and play, lrc lyrics in room and page, blank line, track switch, track jump back, badge seek both ways, pause clears lyrics and animations, mute, palette, mobile badge layout, reduced motion.');
} catch (error) {
  try { console.error('STATE', evaluate(`({room:{...document.querySelector('.room').dataset},deck:document.querySelector('.room-deck-now')?.textContent,badge:document.querySelector('.music-track')?.textContent,lyrics:[...document.querySelectorAll('.music-float .lyric')].map(e=>({key:e.dataset.lyricKey,text:e.textContent,on:e.classList.contains('on')}))})`)); } catch {}
  throw error;
} finally {
  try { run('set', 'media', 'dark'); run('close'); } catch {}
}
