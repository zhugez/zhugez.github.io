import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { toonify } from './toon';

type MascotOptions = { base: URL; get: () => { playing: boolean } };

const FRAME = 1 / 30;
const HALF_HEIGHT = 0.49;
const POKE_SECONDS = 0.75;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const ease = (v: number, goal: number, k: number) => v + (goal - v) * k;

export function mountMascot(host: HTMLElement, opts: MascotOptions) {
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const colorContext = document.createElement('canvas').getContext('2d')!;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-HALF_HEIGHT, HALF_HEIGHT, HALF_HEIGHT, -HALF_HEIGHT, 0.1, 10);
  camera.position.set(0.55, 0.62, 1.4);
  camera.lookAt(0, 0.4, 0);

  const ambient = new THREE.HemisphereLight(0xdfe6ff, 0x6a72a8, 1.35);
  const key = new THREE.DirectionalLight(0xffe0c2, 2.4);
  key.position.set(0.9, 1.2, 1.3);
  const rim = new THREE.DirectionalLight(0x7d97ec, 2.2);
  rim.position.set(-0.5, 0.9, -1.2);
  scene.add(ambient, key, rim);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    return { poke() {}, dispose() {} };
  }
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 'mascot-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  const pivots: Record<string, THREE.Object3D> = {};
  let ramp: THREE.DataTexture | undefined;
  let model: THREE.Object3D | undefined;
  let disposed = false, onScreen = false, running = false;
  let raf = 0, last = 0, accentKey = '';
  let pointerX = 0, pointerY = 0, lookX = 0, lookY = 0, dance = 0, pokeAt = -1;
  let restY = 0;

  function readAccent() {
    colorContext.fillStyle = '#7d97ec';
    colorContext.fillStyle = getComputedStyle(host).getPropertyValue('--accent').trim() || '#7d97ec';
    const next = colorContext.fillStyle as string;
    if (next === accentKey) return;
    accentKey = next;
    rim.color.set(next);
  }

  function resize() {
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.left = -HALF_HEIGHT * aspect;
    camera.right = HALF_HEIGHT * aspect;
    camera.updateProjectionMatrix();
    if (model && !running) draw(performance.now() / 1000);
  }

  function pose(t: number, dt: number) {
    const playing = opts.get().playing && !motion.matches;
    dance = ease(dance, playing ? 1 : 0, Math.min(1, dt * 6));
    lookX = ease(lookX, pointerX, Math.min(1, dt * 5));
    lookY = ease(lookY, pointerY, Math.min(1, dt * 5));
    const beat = t * Math.PI * 4;
    const swing = Math.sin(beat), hop = Math.abs(Math.sin(beat));
    const breathe = Math.sin(t * 1.9), sway = Math.sin(t * 1.3);
    let poke = 0;
    if (pokeAt >= 0) {
      const p = (t - pokeAt) / POKE_SECONDS;
      if (p >= 1) pokeAt = -1;
      else poke = Math.sin(Math.PI * p);
    }
    const wave = poke * Math.sin(((t - pokeAt) / POKE_SECONDS) * 28);

    pivots.character.position.y = restY + hop * 0.03 * dance + poke * 0.08;
    pivots.character.rotation.y = lookX * 0.12;
    pivots.body.scale.y = 1 + breathe * 0.012 * (1 - dance);
    pivots.body.rotation.y = lookX * 0.15 + swing * 0.1 * dance;
    pivots.body.rotation.z = sway * 0.025 * (1 - dance) + Math.sin(beat / 2) * 0.07 * dance;
    pivots.head.rotation.y = lookX * 0.4;
    pivots.head.rotation.x = -lookY * 0.18 + breathe * 0.015;
    pivots.head.rotation.z = -Math.sin(beat / 2) * 0.1 * dance;
    pivots.arm_l.rotation.z = sway * 0.04 * (1 - dance) + (1.75 + swing * 0.6) * dance + poke * (2.2 + wave * 0.3) * (1 - dance);
    pivots.arm_r.rotation.z = -sway * 0.04 * (1 - dance) - (1.75 - swing * 0.6) * dance;
    pivots.leg_l.rotation.x = swing * 0.12 * dance;
    pivots.leg_r.rotation.x = -swing * 0.12 * dance;
    const tailSwing = Math.sin(t * 2.2) * 0.07 * (1 - dance) + Math.sin(beat / 2) * 0.28 * dance;
    pivots.tail_l.rotation.z = tailSwing - lookX * 0.06 + poke * 0.2;
    pivots.tail_r.rotation.z = tailSwing - lookX * 0.06 - poke * 0.2;
    pivots.tail_l.rotation.x = Math.cos(t * 1.7) * 0.05 + swing * 0.08 * dance;
    pivots.tail_r.rotation.x = Math.cos(t * 1.7 + 1) * 0.05 + swing * 0.08 * dance;
  }

  function draw(t: number, dt = 0) {
    readAccent();
    pose(t, dt);
    renderer.render(scene, camera);
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (now - last < FRAME * 1000 - 2) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    draw(now / 1000, dt);
  }

  function sync() {
    const want = !disposed && !!model && !motion.matches && onScreen && document.visibilityState === 'visible';
    if (want && !running) {
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    } else if (!want && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  const onPointer = (e: PointerEvent) => {
    pointerX = clamp((e.clientX / innerWidth) * 2 - 1, -1, 1);
    pointerY = clamp((e.clientY / innerHeight) * 2 - 1, -1, 1);
  };
  const resizeObserver = new ResizeObserver(resize);
  const visibleObserver = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting;
    sync();
  });
  const onMotion = () => {
    sync();
    if (model && !running) draw(performance.now() / 1000);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', onMotion);
  resizeObserver.observe(host);
  visibleObserver.observe(host);
  resize();

  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(new URL('models/miku.glb', opts.base).href).then((gltf) => {
    if (disposed) return;
    model = gltf.scene;
    for (const name of ['character', 'body', 'head', 'arm_l', 'arm_r', 'leg_l', 'leg_r', 'tail_l', 'tail_r']) {
      const node = model.getObjectByName(name);
      if (!node) throw new Error('miku.glb is missing pivot ' + name);
      pivots[name] = node;
    }
    restY = pivots.character.position.y;
    ramp = toonify(model);
    scene.add(model);
    draw(performance.now() / 1000);
    host.classList.add('is-3d');
    sync();
  }).catch(() => dispose());

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    running = false;
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', sync);
    motion.removeEventListener('change', onMotion);
    resizeObserver.disconnect();
    visibleObserver.disconnect();
    model?.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.geometry.dispose();
      const material = node.material as THREE.MeshToonMaterial | THREE.MeshBasicMaterial;
      material.map?.dispose();
      material.dispose();
    });
    ramp?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    host.classList.remove('is-3d');
  }

  return {
    poke() {
      if (!model || motion.matches) return;
      pokeAt = performance.now() / 1000;
    },
    dispose
  };
}
