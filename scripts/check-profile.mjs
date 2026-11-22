import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const session = 'zhugez-profile-regression';
const run = async (...args) => {
  const { stdout } = await exec('agent-browser', ['--session', session, '--json', ...args], { encoding: 'utf8', timeout: 60000 });
  const response = JSON.parse(stdout);
  assert.equal(response.success, true, response.error || args.join(' '));
  return response.data;
};
const evaluate = async source => (await run('eval', source)).result;
const harness = '<div id="target"></div><script type="module">import {mount,unmount,tick} from "svelte";import Profile from "/src/components/Profile.svelte";import {ProfileRuntime} from "/src/components/profile-runtime.ts";import "/src/styles/global.css";const native=ProfileRuntime.prototype.dispose;window.disposals=0;ProfileRuntime.prototype.dispose=function(){native.call(this);window.disposals++};let instance;window.remount=async()=>{instance=mount(Profile,{target:document.querySelector("#target")});await tick()};window.teardown=async()=>{await unmount(instance);await tick()};await window.remount();</script>';
const server = await createServer({
  configFile: false,
  root: new URL('..', import.meta.url).pathname,
  plugins: [svelte(), { name: 'profile-lifecycle-harness', configureServer(server) {
    server.middlewares.use('/__profile_test__', async (_request, response, next) => {
      try { response.setHeader('Content-Type', 'text/html'); response.end(await server.transformIndexHtml('/__profile_test__', harness)); } catch (error) { next(error); }
    });
  } }],
  server: { host: '127.0.0.1', port: 0 },
});
await server.listen();
const port = server.httpServer.address().port;
try {
  await run('open', `http://127.0.0.1:${port}/__profile_test__`);
  assert.equal(await evaluate(`(async()=>{for(let i=0;i<100;i++){if(window.teardown&&document.querySelector('.page'))return true;await new Promise(r=>setTimeout(r,100))}return false})()`), true);
  for (let cycle = 0; cycle < 2; cycle++) {
    const proof = await evaluate(`(async()=>{const contexts=[...document.querySelectorAll('canvas')].filter(c=>c.classList.contains('aurora')||c.dataset.engine).map(c=>c.getContext(c.classList.contains('aurora')?'webgl':'webgl2')).filter(Boolean);await window.teardown();return {contexts:contexts.length,lost:contexts.every(c=>c.isContextLost()),disposed:window.disposals,removed:!document.querySelector('.page'),restored:!document.documentElement.classList.contains('dc-cursor-on')&&!document.body.classList.contains('dc-modal-lock')}})()`);
    assert.ok(proof.contexts > 0);
    assert.equal(proof.lost, true);
    assert.equal(proof.disposed, cycle + 1);
    assert.equal(proof.removed && proof.restored, true);
    await evaluate(`window.remount()`);
  }
  console.log('PASS: actual Svelte mount/unmount calls dispose exactly once, releases WebGL contexts, restores page state and remounts.');
} finally {
  try { await run('close'); } finally { await server.close(); }
}
