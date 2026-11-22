import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const session = 'zhugez-game-regression';
const url = process.argv[2] || 'http://127.0.0.1:4321/';
const run = (...args) => {
  const response = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 90000 }));
  assert.equal(response.success, true, response.error || args.join(' '));
  return response.data;
};
const evaluate = (source) => run('eval', source).result;
const room = (key) => {
  const value = evaluate(`(h=>h?h.dataset.${key}??'':'NO_ROOM '+location.href+' '+document.readyState+' '+(performance.getEntriesByType('navigation')[0]?.type)+' '+Math.round(performance.now()))(document.querySelector('.room'))`);
  if (typeof value === 'string' && value.startsWith('NO_ROOM')) throw new Error(`room element missing: ${value}`);
  return value;
};
const position = () => room('roomPlayer').split(',').map(Number);
const key = (type, code) => evaluate(`window.dispatchEvent(new KeyboardEvent('${type}',{code:'${code}',key:'${code}',bubbles:true}))`);
const until = (check, seconds, message) => {
  console.log(`[${Math.round(process.uptime())}s] ${message}`);
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    const value = check();
    if (value) return value;
    execFileSync('sleep', ['0.5']);
  }
  assert.fail(message);
};
const openRoom = () => {
  run('open', url);
  run('wait', '.room');
  evaluate(`document.querySelector('.room').scrollIntoView({block:'center'})`);
  until(() => {
    try { return room('roomState') === 'ready' && evaluate(`!document.querySelector('.room-enter').hidden`); } catch { return false; }
  }, 120, 'the studio room loads and the launcher appears');
};

try {
  run('open', url);
  run('set', 'viewport', '820', '560');
  run('set', 'media', 'dark', 'reduced-motion');
  openRoom();
  const scrolled = evaluate('scrollY');
  run('click', '.room-enter');
  assert.equal(room('roomMode'), 'play');
  assert.equal(evaluate(`!!document.querySelector('body>.room-stage>canvas') && document.activeElement.classList.contains('room-stage')`), true);
  assert.equal(evaluate(`[...document.body.children].every(e=>e.classList.contains('room-stage')||e.inert)`), true, 'page behind the game is inert');
  assert.equal(evaluate(`getComputedStyle(document.documentElement).overflow`), 'hidden');

  const start = position();
  key('keydown', 'KeyW');
  until(() => Math.hypot(position()[0] - start[0], position()[1] - start[1]) > 0.15, 30, 'W must move the character');
  key('keyup', 'KeyW');
  const stopped = position();
  execFileSync('sleep', ['1.5']);
  assert.deepEqual(position(), stopped, 'character stops when the key is released');

  key('keydown', 'KeyA');
  let previous = position();
  until(() => {
    const now = position();
    const same = Math.hypot(now[0] - previous[0], now[1] - previous[1]) < 1e-3;
    previous = now;
    return same;
  }, 60, 'holding a direction must end against a wall or furniture');
  key('keyup', 'KeyA');
  const [x, z] = position();
  assert.ok(Math.abs(x) < 3 && Math.abs(z) < 2, `character stays inside the room: ${x},${z}`);

  // clicking the 3D floor on the canvas must walk the character there.
  run('set', 'viewport', '1440', '960');
  const beforeClick = position();
  const point = [400, 860];
  evaluate(`(()=>{const c=document.querySelector('body>.room-stage>canvas'),o={clientX:${point[0]},clientY:${point[1]},bubbles:true,pointerId:1,pointerType:'mouse',button:0};c.dispatchEvent(new PointerEvent('pointermove',o));c.dispatchEvent(new PointerEvent('pointerdown',o));c.dispatchEvent(new PointerEvent('pointerup',o));c.dispatchEvent(new MouseEvent('click',o));})()`);
  until(() => Math.hypot(position()[0] - beforeClick[0], position()[1] - beforeClick[1]) > 0.2, 60, 'clicking the canvas floor walks the character there');

  const zoom = Number(room('roomZoom') || 2.4);
  run('click', '.room-hud-actions [data-zoom="1"]');
  assert.ok(Number(room('roomZoom')) > zoom, 'zoom in button');
  run('click', '.room-hud-actions [data-zoom="-1"]');
  run('click', '.room-hud-actions [data-zoom="-1"]');
  assert.ok(Number(room('roomZoom')) < zoom, 'zoom out button');
  const goTo = (label) => evaluate(`(()=>{const s=document.querySelector('.room-goto select'),o=[...s.options].find(o=>o.text===${JSON.stringify(label)});if(!o)return false;s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  assert.equal(goTo('Desk plant'), true);
  until(() => room('roomNear') === 'Desk plant' && /Watered/.test(evaluate(`document.querySelector('.room-card.on')?.textContent ?? ''`)), 90, 'the Go to list walks to the desk plant and waters it');

  // the record player sits behind the desk box at this camera angle, so it is reached by name.
  goTo('Audio-Technica AT-LPA2');
  until(() => room('roomNear') === 'Audio-Technica AT-LPA2' && /No record on the platter/.test(evaluate(`document.querySelector('.room-card').textContent`)), 90, 'the empty record player asks for a record');
  evaluate(`(s=>{s.value=[...s.options].find(o=>o.text==='Adele · 30 · LP 1').value;s.dispatchEvent(new Event('change',{bubbles:true}));return 1})(document.querySelector('.room-goto select'))`);
  until(() => room('roomVinyl') === 'A playing', 150, 'LP 1 is carried to the deck and plays');
  run('mouse', 'move', '5', '300');
  evaluate(`document.querySelector('.room-deck [data-deck="done"]')?.click()`);
  run('press', 'e');
  until(() => room('roomVinyl') === 'A stopped', 15, 'E lifts the arm once');
  execFileSync('sleep', ['1.5']);
  assert.equal(room('roomVinyl'), 'A stopped', 'one E press must not toggle twice');

  run('press', 'Escape');
  assert.equal(evaluate(`document.querySelector('.room-deck').hidden`), true, 'first Escape closes the turntable panel');
  assert.equal(room('roomMode'), 'play');
  run('press', 'Escape');
  assert.equal(evaluate(`document.querySelector('.room-card').classList.contains('on')`), false, 'second Escape closes the object card');
  run('press', 'Escape');
  assert.equal(room('roomMode'), 'embed');
  assert.equal(evaluate(`!!document.querySelector('.room-stage')||[...document.body.children].some(e=>e.inert)`), false);
  assert.equal(evaluate(`document.activeElement.classList.contains('room-enter')`), true, 'focus returns to the launcher');
  assert.ok(Math.abs(evaluate('scrollY') - scrolled) < 4, 'scroll position is kept');
  run('click', '.room-enter');
  run('press', 'Escape');
  run('press', 'Escape');
  assert.equal(room('roomMode'), 'embed', 'enter and exit can repeat');

  run('click', '.room-enter');
  for (const label of ['Sofa', 'Side sofa', 'TV', 'TV console', 'Coffee table', 'Wall shelves', 'Books', 'Record sleeves', 'Break the code', 'We live in the code', 'Hello, friend', 'Circuit mural', 'ZhugeZ', 'Studio desk', 'Record cabinet', 'Desk plant', 'Home lab rack', 'Laptop station', 'Desk lamp', 'Ortizan C7 · left', 'Studio chair', 'Arturia KeyLab Essential 88 mk3', 'LG 24GS60F-B']) {
    assert.equal(evaluate(`[...document.querySelectorAll('.room-goto option')].some(o=>o.text===${JSON.stringify(label)})`), true, `${label} is an interactive object`);
  }
  assert.equal(evaluate(`[...document.querySelectorAll('.room-goto option')].some(o=>/Wall speaker|Hexagon light panels/.test(o.text))`), false, 'the removed wall speakers and old hex panels are gone');
  goTo('Home lab rack');
  until(() => room('roomNear') === 'Home lab rack' && /status lights/.test(evaluate(`document.querySelector('.room-card.on')?.textContent ?? ''`)), 90, 'the rack shows its info card');

  goTo('Sofa');
  until(() => room('roomSeat') === 'Sofa' && room('roomActivity') === 'tv', 90, 'walking to the sofa sits down and frames the TV');
  assert.equal(room('roomTv'), 'on', 'sitting on the sofa turns the TV on');
  assert.equal(evaluate(`document.querySelector('.room-seat').hidden`), false, 'seat controls are shown');
  run('press', 'Escape');
  assert.equal(room('roomActivity'), '', 'first Escape leaves the TV view');
  assert.equal(room('roomSeat'), 'Sofa', 'still seated after leaving the TV view');
  run('press', 'Escape');
  assert.equal(room('roomSeat'), '', 'second Escape stands up');
  assert.equal(room('roomMode'), 'play');

  goTo('LG 24GS60F-B');
  until(() => room('roomActivity') === 'computer', 90, 'the monitor seats the character at the desk and opens the computer');
  assert.equal(room('roomSeat'), 'Studio chair');
  until(() => evaluate(`(()=>{const s=document.querySelector('.room-screen'),r=s.getBoundingClientRect();return !s.hidden&&r.width>150&&r.height>80&&!!s.querySelector('.w11-icon[data-app="firefox"]')})()`), 20, 'the desktop with its app icons is visible over the monitor');
  evaluate(`document.querySelector('.room-screen .w11-icon[data-app="firefox"]').focus()`);
  run('press', 'Enter');
  assert.equal(room('roomActivity'), 'computer', 'Enter on a desktop icon must not stand the character up');
  const screen = until(() => evaluate(`(()=>{const w=document.querySelector('.room-screen .w11-firefox');return w&&{images:w.querySelectorAll('.w11-art img').length,works:(window.ARISE_WORKS||[]).length,links:[...w.querySelectorAll('a')].map(a=>a.getAttribute('href'))}})()`), 20, 'Enter opens the Firefox window');
  assert.ok(screen.works > 0 && screen.images === screen.works, 'the screen shows every artwork from this page');
  assert.ok(screen.links.includes('https://github.com/zhugez') && screen.links.includes('mailto:dezzhuge@gmail.com'), 'the screen lists the real links from this page');
  run('press', 'Escape');
  assert.equal(room('roomActivity'), '', 'Escape leaves the computer view');
  assert.equal(evaluate(`document.querySelector('.room-screen').hidden`), true);

  run('click', '.room-seat [data-act="piano"]');
  assert.equal(room('roomActivity'), 'piano', 'the seat controls switch to piano mode');
  key('keydown', 'KeyA');
  until(() => room('roomKeys') === '60' && room('roomVoices') === '1', 20, 'A presses C4: the key node moves and one voice starts');
  key('keydown', 'KeyD');
  key('keydown', 'KeyG');
  until(() => room('roomKeys') === '60 64 67' && room('roomVoices') === '3', 20, 'a three-key chord moves three keys with three voices');
  key('keyup', 'KeyA');
  key('keyup', 'KeyD');
  key('keyup', 'KeyG');
  until(() => room('roomKeys') === '' && room('roomVoices') === '0', 20, 'releasing the chord lifts the keys and stops the voices');
  key('keydown', 'Space');
  until(() => room('roomSustain') === 'on', 10, 'Space holds the sustain pedal');
  key('keydown', 'KeyA');
  key('keyup', 'KeyA');
  until(() => room('roomKeys') === '' && room('roomVoices') === '1', 20, 'sustain keeps the voice after the key comes up');
  key('keyup', 'Space');
  until(() => room('roomSustain') === 'off' && room('roomVoices') === '0', 20, 'lifting sustain releases the held voice');
  key('keydown', 'KeyA');
  until(() => room('roomVoices') === '1', 20, 'a held note before leaving');
  run('press', 'Escape');
  until(() => room('roomActivity') === '' && room('roomVoices') === '0' && room('roomKeys') === '', 20, 'leaving piano mode releases every key and voice');
  key('keyup', 'KeyA');
  run('press', 'Escape');
  assert.equal(room('roomSeat'), '', 'Escape stands up from the chair');
  run('press', 'Escape');
  assert.equal(room('roomMode'), 'embed', 'the last Escape exits play mode');
  assert.equal(room('roomTv'), 'off', 'leaving play mode turns the TV off');

  run('set', 'device', 'iPhone 12');
  openRoom();
  run('click', '.room-enter');
  assert.equal(evaluate(`getComputedStyle(document.querySelector('.room-stick')).display`), 'block', 'touch joystick is shown on coarse pointers');
  assert.equal(evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
  const before = position();
  evaluate(`(()=>{const s=document.querySelector('.room-stick'),r=s.getBoundingClientRect(),o={pointerId:7,pointerType:'touch',bubbles:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2};s.dispatchEvent(new PointerEvent('pointerdown',o));s.dispatchEvent(new PointerEvent('pointermove',{...o,clientY:r.top+4}));})()`);
  until(() => Math.hypot(position()[0] - before[0], position()[1] - before[1]) > 0.1, 40, 'joystick moves the character');
  evaluate(`(()=>{const s=document.querySelector('.room-stick');s.dispatchEvent(new PointerEvent('pointerup',{pointerId:7,pointerType:'touch',bubbles:true}))})()`);
  const released = position();
  execFileSync('sleep', ['1.5']);
  assert.deepEqual(position(), released, 'joystick release stops the character');
  run('click', '.room-hud-actions [data-exit]');
  assert.equal(room('roomMode'), 'embed');
  assert.equal(evaluate(`[...document.querySelectorAll('.page *')].some(e=>e.inert)`), false);

  console.log('PASS: full-screen play mode, keyboard walk/stop, wall collision, canvas click-to-walk, zoom buttons, record player by name, single E toggle, Escape unwinding, focus/scroll restore, repeat entry, object list, rack card, sofa + TV, computer screen, piano keys/chord/sustain/release, stand up, touch joystick, mobile overflow.');
} finally {
  try { run('close'); } catch {}
}
