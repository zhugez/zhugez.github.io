import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const session = 'zhugez-music-regression';
const url = process.argv[2] || 'http://127.0.0.1:4321/';
const run = (...args) => {
  const response = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.equal(response.success, true, response.error || args.join(' '));
  return response.data;
};
const evaluate = source => run('eval', source).result;
const ready = () => evaluate(`(async()=>{
  for(let n=0;n<100;n++){
    const a=document.querySelector('audio[src$="soft-static.mp3"]');
    if(a?.readyState>=2&&!document.querySelector('.boot'))return true;
    await new Promise(r=>setTimeout(r,100));
  }
  throw Error('Music did not load');
})()`);
const track = `document.querySelector('audio[src$="soft-static.mp3"]')`;
const overlaps = `((a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)`;

try {
  run('open', url);
  run('set', 'viewport', '1440', '960');
  run('set', 'media', 'dark', 'reduced-motion');
  run('open', url);
  ready();
  evaluate(`localStorage.removeItem('zhugez.music.open');document.querySelector('.room').scrollIntoView({block:'center'})`);
  run('wait', '[data-room-state="ready"]');
  run('snapshot', '-i');
  assert.equal(evaluate(`document.querySelectorAll('audio[src$="soft-static.mp3"]').length`), 1);
  assert.equal(evaluate(`document.querySelectorAll('#sec-music').length`), 1);
  assert.equal(evaluate(`!!document.querySelector('.stage')`), false);
  assert.equal(evaluate(`document.querySelector('.music-options').hidden`), true);
  assert.equal(evaluate(`[...document.querySelector('.music-badge').children].filter(e=>e.getClientRects().length).map(e=>e.className).join()`), 'music-record');
  assert.equal(evaluate(`(r=>[r.getAttribute('aria-expanded'),r.getAttribute('aria-controls'),r.getAttribute('aria-label')].join())(document.querySelector('.music-record'))`), 'false,music-options,Soft Static player');
  assert.ok(evaluate(`Math.min(...(r=>[r.width,r.height])(document.querySelector('.music-record').getBoundingClientRect()))`) >= 44);
  assert.equal(evaluate(`!!document.querySelector('.music-notes,.music-disclosure')`), false);
  const deck = (() => {
    const [left, top, width, height] = evaluate(`(r=>[r.left,r.top,r.width,r.height])(document.querySelector('.room canvas').getBoundingClientRect())`);
    const points = [];
    for (let ring = 0; ring <= 4; ring++) for (let dx = -ring; dx <= ring; dx++) for (let dy = -ring; dy <= ring; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) === ring) points.push([Math.round(left + width * (0.616 + dx * 0.02)), Math.round(top + height * (0.405 + dy * 0.02))]);
    }
    for (const point of points) {
      run('mouse', 'move', ...point.map(String));
      if (evaluate(`(async()=>{for(let n=0;n<30;n++){if(document.querySelector('.room-tip').textContent.includes('Record player ·'))return true;await new Promise(r=>setTimeout(r,100));}return false;})()`)) return point;
    }
  })();
  assert.ok(deck, 'Turntable must be visible and reachable');
  run('mouse', 'down'); run('mouse', 'up'); run('wait', '650');
  assert.equal(evaluate(`${track}.paused`), false);
  assert.ok(evaluate(`${track}.currentTime`) > 0.1);
  assert.equal(evaluate(`document.querySelector('.room-play').getAttribute('aria-label')`), 'Pause Soft Static');
  assert.equal(evaluate(`document.querySelector('.music-badge').classList.contains('is-playing')`), true);
  assert.equal(evaluate(`getComputedStyle(document.querySelector('.music-disc')).animationName`), 'none');
  assert.equal(evaluate(`getComputedStyle(document.querySelector('.music-float')).display`), 'none');
  assert.equal(evaluate(`document.querySelectorAll('.music-float .on').length`), 0, 'Reduced motion must not spawn floating notes');
  run('mouse', 'down'); run('mouse', 'up'); run('wait', '200');
  assert.equal(evaluate(`${track}.paused`), true);
  assert.equal(evaluate(`document.querySelector('.music-badge').classList.contains('is-playing')`), false);
  run('click', '.music-record');
  assert.equal(evaluate(`document.querySelector('.music-options').hidden`), false);
  assert.equal(evaluate(`document.querySelector('.music-record').getAttribute('aria-expanded')`), 'true');
  run('click', '.music-play'); run('wait', '500');
  assert.equal(evaluate(`${track}.paused`), false);
  assert.equal(evaluate(`document.querySelector('.room-play').getAttribute('aria-label')`), 'Pause Soft Static');
  run('click', '.music-play'); run('wait', '150');
  assert.equal(evaluate(`${track}.paused`), true);
  run('click', '.room-play'); run('wait', '500');
  assert.equal(evaluate(`${track}.paused`), false);
  assert.equal(evaluate(`document.querySelector('.music-play').getAttribute('aria-label')`), 'Pause Soft Static');
  run('click', '.music-play'); run('wait', '150');
  assert.equal(evaluate(`document.querySelector('.room-play').getAttribute('aria-label')`), 'Play Soft Static');
  run('focus', '.music-seek'); run('press', 'Home'); run('press', 'ArrowRight'); run('wait', '150');
  assert.ok(evaluate(`${track}.currentTime`) > 0);
  const noteAt = (time) => {
    evaluate(`${track}.currentTime=${time}`);
    run('wait', '180');
    return evaluate(`document.querySelector('.music-note').textContent`);
  };
  assert.equal(noteAt(1.3), 'D5');
  assert.equal(noteAt(13.9), 'D5');
  assert.equal(noteAt(8.9), 'C5');
  run('press', 'End'); run('wait', '150');
  assert.ok(evaluate(`${track}.currentTime`) > 24);
  evaluate(`${track}.currentTime=24.9`);
  run('click', '.music-play');
  const looped = evaluate(`(async()=>{for(let n=0;n<40;n++){await new Promise(r=>setTimeout(r,100));if(${track}.currentTime<3&&!${track}.paused)break;}return [${track}.currentTime,${track}.paused];})()`);
  assert.ok(looped[0] < 3 && !looped[1], 'Loop must return to start: ' + looped);
  run('click', '.music-play');
  evaluate(`[...document.querySelectorAll('.music-actions button')].find(b=>b.textContent==='Mute').click()`);
  assert.equal(evaluate(`${track}.muted`), true);
  evaluate(`[...document.querySelectorAll('.music-actions button')].find(b=>b.textContent==='Unmute').click()`);
  assert.equal(evaluate(`${track}.muted`), false);
  run('click', '.music-record');
  run('reload'); ready();
  assert.equal(evaluate(`document.querySelector('.music-options').hidden`), true);
  run('click', '.music-record');
  run('reload'); ready();
  assert.equal(evaluate(`document.querySelector('.music-options').hidden`), false);
  assert.equal(evaluate(`document.querySelector('.music-record').getAttribute('aria-expanded')`), 'true');
  run('set', 'viewport', '375', '760');
  assert.equal(evaluate(`document.documentElement.scrollWidth<=innerWidth`), true);
  assert.equal(evaluate(`getComputedStyle(document.querySelector('.music-badge')).position`), 'fixed');
  for (const part of ['.music-options', '.music-record']) for (const selector of ['.theme-dock', '[aria-label="Open command palette"]']) {
    assert.equal(evaluate(`${overlaps}(document.querySelector(${JSON.stringify(part)}).getBoundingClientRect(),document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect())`), false, part + ' overlaps ' + selector);
  }
  run('click', '[aria-label="Theme settings"]');
  assert.equal(evaluate(`document.querySelector('.music-options').hidden`), true);
  assert.ok(evaluate(`!!document.querySelector('[aria-label="Accent hue"]')`));
  run('click', '.music-record');
  assert.equal(evaluate(`!!document.querySelector('[aria-label="Accent hue"]')`), false);
  assert.equal(evaluate(`document.querySelector('.music-options').hidden`), false);
  run('set', 'media', 'dark');
  run('set', 'viewport', '1440', '960');
  run('reload'); ready();
  const floating = `document.querySelectorAll('.music-float .on').length`;
  const waitFloatingClear = () => evaluate(`(async()=>{for(let n=0;n<60;n++){if(!${floating})return true;await new Promise(r=>setTimeout(r,100));}return false;})()`);
  assert.equal(evaluate(`(f=>[f.getAttribute('aria-hidden'),getComputedStyle(f).pointerEvents,getComputedStyle(f).position,f.children.length].join())(document.querySelector('.music-float'))`), 'true,none,fixed,8');
  run('click', '.music-play');
  assert.ok(evaluate(`(async()=>{for(let n=0;n<40;n++){if(${floating})return true;await new Promise(r=>setTimeout(r,100));}return false;})()`), 'Floating notes must appear while playing');
  assert.match(evaluate(`document.querySelector('.music-float .on').textContent`), /^[A-G]#?\d$/);
  assert.equal(evaluate(`getComputedStyle(document.querySelector('.music-disc')).animationPlayState`), 'running');
  assert.equal(evaluate(`document.documentElement.scrollWidth<=innerWidth`), true);
  run('press', 'Control+k');
  assert.equal(evaluate(`document.querySelector('.music-badge').hidden`), true);
  assert.equal(waitFloatingClear(), true, 'No floating notes while the palette is open');
  run('press', 'Escape');
  run('click', '.music-play');
  assert.equal(evaluate(`${track}.paused`), true);
  assert.equal(evaluate(`getComputedStyle(document.querySelector('.music-disc')).animationPlayState`), 'paused');
  assert.equal(waitFloatingClear(), true, 'Floating notes must stop when paused');
  console.log('PASS: vinyl-only collapsed badge, real turntable click, panel/room playback sync, keyboard seek, loop, mute, persisted collapse/expand, mobile fixed position and theme separation, reduced motion, floating notes while playing only.');
} finally {
  run('set', 'media', 'dark');
  run('close');
}
