import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const session = 'zhugez-works-regression';
const url = process.argv[2] || 'http://127.0.0.1:4321/';
const run = (...args) => {
  const response = JSON.parse(execFileSync('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8' }));
  assert.equal(response.success, true, response.error || args.join(' '));
  return response.data;
};
const evaluate = (source) => run('eval', source).result;
const ready = () => evaluate(`(async()=>{
  for(let i=0;i<100;i++){
    if(document.querySelectorAll('.work-color').length===3&&!document.querySelector('.boot'))return true;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error('Works did not become ready');
})()`);

try {
  run('open', url);
  run('set', 'viewport', '1280', '800');
  ready();
  run('snapshot', '-i');
  assert.equal(evaluate("document.querySelector('.page').style.getPropertyValue('--accent')"), 'hsl(226 72% 68%)');
  assert.equal(evaluate("getComputedStyle(document.querySelector('.page')).getPropertyValue('--bg')"), '#070a15');
  const forced = evaluate(`(()=>{
    const native=matchMedia('(hover:hover) and (pointer:fine)').matches;
    if(!native)for(const sheet of document.styleSheets){try{for(const rule of sheet.cssRules){
      if(rule instanceof CSSMediaRule&&/pointer\\s*:\\s*fine/.test(rule.conditionText)&&rule.cssText.includes('.work-color'))rule.media.mediaText='screen';
    }}catch{}}
    document.querySelector('#sec-works').scrollIntoView({block:'center'});
    return !native;
  })()`);
  const rect = evaluate("document.querySelectorAll('.work-cell')[1].getBoundingClientRect().toJSON()");
  const masks = [];
  for (const fraction of [0.25, 0.75]) {
    run('mouse', 'move', String(Math.round(rect.left + rect.width * fraction)), String(Math.round(rect.top + 100)));
    const state = evaluate(`(()=>{const cell=document.querySelectorAll('.work-cell')[1];return {
      x:parseFloat(cell.style.getPropertyValue('--spot-x')),
      mask:getComputedStyle(cell.querySelector('.work-color')).maskImage,
      filter:getComputedStyle(cell.querySelector('.work-base')).filter
    }})()`);
    assert.ok(state.filter.includes('grayscale(1)'));
    assert.ok(state.mask.includes('radial-gradient'));
    assert.ok(Math.abs(state.x - rect.width * fraction) < 2);
    masks.push(state.mask);
  }
  assert.notEqual(masks[0], masks[1]);
  run('mouse', 'move', '10', '10');
  assert.equal(evaluate("document.querySelectorAll('.work-cell')[1].style.getPropertyValue('--spot-x')"), '');
  evaluate("document.querySelectorAll('.work-cell')[1].focus()");
  assert.equal(evaluate("getComputedStyle(document.querySelectorAll('.work-base')[1]).filter"), 'none');
  run('press', 'Enter');
  run('snapshot', '-i');
  assert.equal(evaluate("!!document.querySelector('[aria-label=\"Work detail\"]')"), true);
  run('press', 'Escape');
  run('snapshot', '-i');
  assert.equal(evaluate("!!document.querySelector('[aria-label=\"Work detail\"]')"), false);
  evaluate("document.querySelector('[aria-label=\"Theme settings\"]').click()");
  evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='☀ Light').click()");
  assert.equal(evaluate("getComputedStyle(document.querySelector('.page')).getPropertyValue('--bg')"), '#eceaf7');
  assert.equal(evaluate("document.querySelector('.page').style.getPropertyValue('--accent')"), 'hsl(226 62% 30%)');
  run('set', 'media', 'dark', 'reduced-motion');
  run('open', url);
  ready();
  assert.equal(evaluate("getComputedStyle(document.querySelector('.work-base')).filter"), 'none');
  assert.equal(evaluate("getComputedStyle(document.querySelector('.work-color')).display"), 'none');
  run('set', 'media', 'dark');
  run('set', 'device', 'iPhone 15');
  run('open', url);
  ready();
  assert.equal(evaluate("matchMedia('(hover:hover) and (pointer:fine)').matches"), false);
  assert.equal(evaluate("getComputedStyle(document.querySelector('.work-base')).filter"), 'none');
  assert.equal(evaluate("getComputedStyle(document.querySelector('.work-color')).display"), 'none');
  assert.equal(evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
  console.log('PASS: spotlight movement/reset, keyboard modal, original indigo-violet palette dark/light, reduced motion, mobile viewport/no-hover fallback.');
  if (forced) console.log('Headless has no fine pointer: spotlight mechanics tested with a temporary page-only media override.');
} finally {
  run('set', 'media', 'dark');
  run('set', 'viewport', '1280', '800');
  run('close');
}
