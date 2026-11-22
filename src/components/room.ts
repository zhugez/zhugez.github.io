import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Grid, rectDistance, step, type Rect } from './collide';
import { createPiano, type Piano } from './room-piano';
import { createMovie } from './room-movie';
import { keyLegend, noteName } from './piano/input';
import type { FeatureTarget, RoomContext, RoomFeature, VinylState } from './room-feature';
import type { LedMode } from './room-lights';
import { FEATURES } from './room-features';
import { toonify } from './toon';
import { createRig, type Gesture } from './room-character';
import { rigSkinned, type SkinnedRig } from './room-skin';

type Opts = {
  get: () => { active: number };
  onHover: (zone: number) => void;
  art?: string;
  gear?: string[];
  details?: Record<string, string>;
  works?: string[];
  links?: [string, string][];
  onVinyl?: (state: VinylState | null) => void;
};

type Kind = 'deck' | 'lamp' | 'gear' | 'solid' | 'piano' | 'computer' | 'seat' | 'tv' | 'laptop' | 'light' | 'speaker' | 'rack' | 'plant';
type Activity = 'piano' | 'computer' | 'tv';
type Seat = { x: number; z: number; y: number; heading: number; activities: Activity[] };

type Target = {
  object: THREE.Object3D;
  meshes: THREE.Mesh[];
  box: THREE.Box3;
  label: string;
  detail: string;
  kind: Kind;
  rect: Rect;
  zone: number;
  deck: boolean;
  loose: boolean;
  glow: number;
  off: boolean;
  dirty: boolean;
  seat?: Seat;
  use?: () => string | void;
  hover?: () => string;
  actionText?: () => string;
  gesture?: () => Gesture | null;
  materials: { material: THREE.MeshStandardMaterial; color: THREE.Color }[];
};

const range = (prefix: string, from: number, to: number, pad = 3) => Array.from({ length: to - from + 1 }, (_, i) => prefix + String(from + i).padStart(pad, '0'));
const ITEMS: [string, string, number, string, Kind, string[]?][] = [
  ['lg_24gs60f_b', 'LG 24GS60F-B', 0, '', 'computer'],
  ['obsbot_meet_2', 'OBSBOT Meet 2', 0, '', 'gear'],
  ['xppen_deco_01_v3', 'XPPen Deco 01 V3', 0, '', 'gear'],
  ['hyperwork_t6_pro_2025', 'HyperWork T6 Pro 2025', 0, 'Monitor arm', 'gear'],
  ['atk_ace68_air', 'ATK ACE68 Air', 1, '', 'gear'],
  ['atk_x1_ultimate', 'ATK Blazing Sky X1 Ultimate', 1, '', 'gear'],
  ['nj81', 'NJ81', 1, '', 'gear'],
  ['secondary_laptop', 'MSI Modern 14', 1, 'Secondary laptop', 'laptop'],
  ['asus_nuc_15_pro_plus', 'ASUS NUC 15 Pro+', 1, 'Mini PC under the monitor', 'gear'],
  ['keylab_essential_88_mk3', 'Arturia KeyLab Essential 88 mk3', 2, '', 'piano'],
  ['arturia_minifuse_2', 'Arturia MiniFuse 2', 2, '', 'gear'],
  ['epz_tp35_pro', 'EPZ TP35 PRO', 2, '', 'gear'],
  ['ath_m50x', 'Audio-Technica ATH-M50x', 2, '', 'gear'],
  ['razer_seiren_v3_chroma', 'Razer Seiren V3 Chroma', 2, '', 'gear'],
  ['turntable', 'Audio-Technica AT-LPA2', 2, 'Record player', 'deck'],
  ['studio_desk', 'Studio desk', -1, 'Desk with a slide-out MIDI tray', 'gear'],
  ['record_cabinet', 'Record cabinet', -1, 'Holds the record player and the record collection', 'gear'],
  ['studio_chair', 'Studio chair', -1, 'Sit here to play the KeyLab or use the computer', 'seat'],
  ['secondary_workstation', 'Laptop station', -1, 'Laptop desk with the MSI Modern 14 and the lamp', 'laptop'],
  ['room_sofa', 'Sofa', -1, 'Faces the TV', 'seat', ['Cube005', 'Cube006', 'Cube007']],
  ['room_side_sofa', 'Side sofa', -1, 'Along the left wall', 'seat', ['Cube075', 'Cube076', 'Cube077']],
  ['Plane002', 'TV', -1, 'Wall-mounted TV', 'tv'],
  ['room_tv_console', 'TV console', -1, 'Two game consoles and a controller', 'gear', ['Plane007', 'Plane008', 'Plane009', 'Cube008', 'Cube009', 'Cylinder004', 'Cylinder048', 'Cube129', 'Cylinder005', 'Cylinder014', 'Cylinder021', 'Cylinder017', 'Cylinder018', 'Cylinder026', 'Cylinder028', 'Cylinder037', 'Cylinder038', 'Sphere002', 'Sphere003', ...range('Cube', 37, 47)]],
  ['room_coffee_table', 'Coffee table', -1, 'A controller, a book, a mug and the TV remote', 'tv', ['Cylinder002', 'Cube026', 'Cube036', 'Cube078', 'Cylinder045', 'Sphere', 'Sphere001', ...range('Cube', 10, 20), ...range('Cylinder', 6, 11)]],
  ['room_books', 'Books', -1, 'A row of books on the lower shelf', 'gear', ['Cube062', 'Cube143', ...range('Cube', 64, 72)]],
  ['room_shelves', 'Wall shelves', -1, 'Books and keepsakes', 'gear', ['Cube059', 'Cube060', 'Cube073', 'Cube074', 'Cube146', 'Cylinder019', 'Cylinder055', ...range('Cube', 132, 136)]],
  ['Text', 'Neon sign', -1, 'On the top shelf', 'light'],
  ['room_pendants', 'Pendant lights', -1, 'Three warm hanging bulbs', 'light', ['Cylinder051', 'Cylinder052', 'Cylinder053', ...range('Sphere', 6, 11)]],
  ['room_record_sleeves', 'Record sleeves', -1, 'Thirteen records in the cabinet', 'gear', range('record_sleeve_', 1, 13, 2)],
];
const SEATS: Record<string, [string, string, Activity[]]> = {
  studio_chair: ['chair_seat', 'chair_back', ['piano', 'computer']],
  room_sofa: ['Cube006', 'Cube007', ['tv']],
  room_side_sofa: ['Cube076', 'Cube077', ['tv']],
};
const ACTIVITY_LABEL: Record<Activity, string> = { piano: 'Play the piano', computer: 'Use the computer', tv: 'Watch TV' };
const OCCLUDERS = ['studio_chair', 'studio_desk', 'secondary_workstation', 'record_cabinet'];
const ANIMATED = ['midi_tray', 'msi_display_lid', 'vinyl_record', 'platter', 'tonearm', 'c7_woofer_left', 'c7_woofer_right'];
const OFFSET = new THREE.Vector3(-7.5, 6.5, 8);
const UP = new THREE.Vector3(0, 1, 0);
const YAW = 0.45;
const SPEED = 1.5;
const RADIUS = 0.17;
const REACH = 0.6;
const MOVES: Record<string, string> = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };

export function mountRoom(host: HTMLElement, opts: Opts) {
  const canvas = document.createElement('canvas');
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    host.classList.add('room-off');
    return { dispose() {} };
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  host.appendChild(canvas);
  host.dataset.roomState = 'loading';

  const status = document.createElement('div');
  status.className = 'room-load';
  status.setAttribute('role', 'status');
  status.textContent = 'Loading your studio…';
  const tip = document.createElement('div');
  tip.className = 'room-tip';
  tip.setAttribute('aria-hidden', 'true');
  const enter = document.createElement('button');
  enter.type = 'button';
  enter.className = 'room-enter';
  enter.textContent = 'Walk around';
  enter.hidden = true;
  const stage = document.createElement('div');
  stage.className = 'room-stage';
  stage.tabIndex = -1;
  stage.setAttribute('role', 'dialog');
  stage.setAttribute('aria-modal', 'true');
  stage.setAttribute('aria-label', 'Studio explorer');
  stage.innerHTML = '<div class="room-hud"><p class="room-hint"><small>Studio explorer</small><span class="room-hint-key">WASD to walk · Shift run · Space jump · Q wave · E use · Esc leave</span><span class="room-hint-touch">Stick or tap to walk · pinch to zoom</span><label class="room-goto"><span>Go to</span><select><option value="">Pick an object…</option></select></label></p><div class="room-hud-actions"><button type="button" data-zoom="-1" aria-label="Zoom out">−</button><button type="button" data-zoom="1" aria-label="Zoom in">+</button><button type="button" data-exit>Exit</button></div></div><button type="button" class="room-prompt" hidden></button><div class="room-card" role="status" aria-live="polite"></div><div class="room-screen" role="region" aria-label="Studio computer" hidden></div><div class="room-seat" role="group" aria-label="Seat controls" hidden></div><div class="room-stick" aria-hidden="true"><span></span></div>';
  const prompt = stage.querySelector<HTMLButtonElement>('.room-prompt')!;
  const card = stage.querySelector<HTMLElement>('.room-card')!;
  const goto = stage.querySelector<HTMLSelectElement>('.room-goto select')!;
  const screen = stage.querySelector<HTMLElement>('.room-screen')!;
  const seatPanel = stage.querySelector<HTMLElement>('.room-seat')!;
  const stickPad = stage.querySelector<HTMLElement>('.room-stick')!;
  const knob = stickPad.firstElementChild as HTMLElement;
  host.append(status, tip, enter);
  host.dataset.roomMode = 'embed';

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  scene.environment = pmrem.fromScene(roomEnvironment, 0.04).texture;
  scene.environmentIntensity = 0.12;
  roomEnvironment.dispose();
  pmrem.dispose();
  const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.01, 100);
  const world = new THREE.Group();
  scene.add(world);
  const sky = new THREE.HemisphereLight();
  scene.add(sky);
  const key = new THREE.DirectionalLight();
  key.position.set(-5, 6, 2.5);
  scene.add(key);
  const pendants = new THREE.PointLight(0xffb070, 0, 4.2, 2);
  const screenGlow = new THREE.PointLight(0x9fb2ff, 0, 2.6, 2);
  const deskGlow = new THREE.PointLight(0x9f8cff, 0, 2, 2);
  const deskKey = new THREE.PointLight(0xffd2a0, 0, 3.2, 2);
  scene.add(pendants, screenGlow, deskGlow, deskKey);
  const wallColor = new THREE.Color(), floorTint = new THREE.Color(), woodTint = new THREE.Color();
  const floorSat = { value: 0.35 }, woodSat = { value: 0.6 };
  const walls: THREE.MeshStandardMaterial[] = [];
  const blob = document.createElement('canvas');
  blob.width = blob.height = 64;
  const blobContext = blob.getContext('2d')!;
  const blobGradient = blobContext.createRadialGradient(32, 32, 0, 32, 32, 32);
  blobGradient.addColorStop(0, 'rgba(0,0,0,1)');
  blobGradient.addColorStop(0.5, 'rgba(0,0,0,.55)');
  blobGradient.addColorStop(1, 'rgba(0,0,0,0)');
  blobContext.fillStyle = blobGradient;
  blobContext.fillRect(0, 0, 64, 64);
  const blobTexture = new THREE.CanvasTexture(blob);

  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const abort = new AbortController();
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const targets: Target[] = [];
  const bounds = new THREE.Box3();
  const center = new THREE.Vector3();
  const pointer = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const accent = new THREE.Color(0x7d97ec), tint = new THREE.Color();
  const look = new THREE.Vector3(), lookGoal = new THREE.Vector3();
  let yaw = 0, yawGoal = 0, zoom = 1, zoomGoal = 1;
  let disposed = false, loaded = false, visible = false, slow = false;
  let frame = 0, drawn = 0, lastTime = 0, probeStart = 0, probeFrames = 0;
  let lastPlaying = false, lastActive = -1, lastNote = '';
  let hovered: Target | null = null, focused: Target | null = null, hoverAt: { x: number; y: number } | null = null;
  let press: { id: number; x: number; y: number; yaw: number } | null = null, dragging = false, suppressClick = false;
  let model: THREE.Group | undefined;
  let exploring = false, viewZoom = 2, hadCursor = false;
  let restoreFocus: HTMLElement | null = null, inertState: [HTMLElement, boolean][] = [];
  const held = new Set<string>();
  const stick = { id: -1, x: 0, y: 0 };
  const touches = new Map<number, { x: number; y: number }>();
  let pinchStart = 0, pinchZoom = 0;
  let rects: Rect[] = [], area: Rect = { x0: 0, z0: 0, x1: 0, z1: 0 }, grid: Grid | undefined, floorY = 0;
  let px = 0, pz = 0, stride = 0, heading = 0, stuck = 0, bodyRest = 0, spawned = false;
  const facing = new THREE.Vector2(0, 1);
  let route: [number, number][] = [], routeTarget: Target | null = null, near: Target | null = null, carded: Target | null = null;
  const floorPlane = new THREE.Plane(UP.clone(), 0);
  const baseUrl = new URL(import.meta.env.BASE_URL, location.origin);
  let pinned: Target | null = null, seat: Target | null = null, activity: Activity | null = null, chair: Target | undefined, tv: Target | undefined;
  let sitting = 0, sitGoal = 0, hip = 0.2, lift = 1, liftGoal = 1, yawBefore = 0, tvOn = false, glowBase = 0;
  let laptopState: 'open' | 'closed' | 'carried' = 'open', lidT = 0, lidGoal = 0, lidY = 0;
  let lid: THREE.Object3D | undefined, handLaptop: THREE.Object3D | undefined, handLaptopContact: THREE.Vector3 | undefined;
  const lidOpen = new THREE.Quaternion(), lidShut = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  let piano: Piano | undefined, tvScreen: { material: THREE.MeshStandardMaterial; map: THREE.Texture | null; intensity: number } | undefined;
  const pianoPointers = new Set<number>();
  const movie = createMovie([...(opts.works ?? []), new URL('media/scene.webp', baseUrl).href], 'ZHUGEZ · ARTWORKS');
  let screenKey = '';
  let features: RoomFeature[] = [];
  const shared: RoomContext['shared'] = { ledMode: 'sync', vinyl: false, nowPlaying: '', lyric: '' };
  let carrying = false, framePending = false;
  const isLight = () => host.closest('[data-theme]')?.getAttribute('data-theme') === 'light';

  const player = new THREE.Group();
  const joints: Record<string, THREE.Object3D | undefined> = {};
  let rig: ReturnType<typeof createRig> | null = null, skin: SkinnedRig | null = null, carrier: THREE.Object3D | undefined, running = false, typedAt = 0;
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blobTexture, transparent: true, opacity: 0.5, depthWrite: false }));
  shadow.position.y = 0.006;
  player.add(shadow);
  player.visible = false;
  world.add(player);
  const syncEnter = () => {
    player.visible = spawned && !!joints.body;
    enter.hidden = !player.visible;
  };
  loader.load(new URL('models/character.glb', baseUrl).href, (gltf) => {
    if (disposed) { release(gltf.scene); return; }
    toonify(gltf.scene);
    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || !(node.material instanceof THREE.MeshToonMaterial)) return;
      node.material.emissive.copy(node.material.color).multiplyScalar(0.28);
      node.material.emissiveMap = node.material.map;
    });
    player.add(gltf.scene);
    if (gltf.animations.length) {
      skin = rigSkinned(gltf.scene, gltf.animations);
      Object.assign(joints, skin.joints);
      carrier = skin.carrier;
      const held = gltf.scene.getObjectByName('Laptop');
      if (held) {
        const scale = held.scale.clone();
        held.scale.setScalar(1);
        gltf.scene.updateMatrixWorld(true);
        handLaptopContact = gltf.scene.worldToLocal(new THREE.Box3().setFromObject(held).getCenter(new THREE.Vector3()));
        held.scale.copy(scale);
      }
    } else {
      for (const name of ['body', 'head', 'leg_l', 'leg_r', 'knee_l', 'knee_r', 'arm_l', 'arm_r', 'elbow_l', 'elbow_r', 'tail_l', 'tail_r']) joints[name] = gltf.scene.getObjectByName(name);
      carrier = joints.body;
    }
    bodyRest = joints.body?.position.y ?? 0;
    handLaptop = gltf.scene.getObjectByName('laptop');
    if (handLaptop) handLaptop.visible = laptopState === 'carried';
    rig = createRig(joints);
    const thigh = skin ? gltf.scene.getObjectByName('ThighL') : joints.leg_l;
    if (thigh instanceof THREE.Object3D) {
      player.updateMatrixWorld(true);
      hip = thigh.getWorldPosition(new THREE.Vector3()).y - player.getWorldPosition(new THREE.Vector3()).y;
    }
    syncEnter();
    start();
  }, undefined, (error) => console.error('Studio character:', error));

  const colorContext = document.createElement('canvas').getContext('2d')!;

  function cssColor(name: string, fallback: string) {
    colorContext.fillStyle = fallback;
    colorContext.fillStyle = getComputedStyle(host).getPropertyValue(name).trim() || fallback;
    return colorContext.fillStyle as string;
  }

  function readAccent() {
    accent.set(cssColor('--accent', '#7d97ec'));
    const hsl = accent.getHSL({ h: 0, s: 0, l: 0 }, THREE.SRGBColorSpace);
    const h = hsl.h, srgb = THREE.SRGBColorSpace;
    const light = host.closest('[data-theme]')?.getAttribute('data-theme') === 'light';
    renderer.toneMappingExposure = light ? 1.08 : 1.14;
    sky.color.setHSL(h, light ? 0.3 : 0.24, light ? 0.92 : 0.8, srgb);
    sky.groundColor.setHSL(0.07, 0.35, light ? 0.55 : 0.16, srgb);
    sky.intensity = light ? 1.6 : 0.95;
    key.color.setHSL(0.09, light ? 0.45 : 0.6, light ? 0.9 : 0.84, srgb);
    key.intensity = light ? 2 : 1.7;
    wallColor.setHSL(h, light ? 0.18 : 0.3, light ? 0.74 : 0.3, srgb);
    walls.forEach((material) => material.color.copy(wallColor));
    floorTint.setHSL(0.07, 0.3, light ? 0.92 : 0.86, srgb);
    floorSat.value = 0.9;
    woodTint.setHSL(0.08, 0.2, 0.92, srgb);
    woodSat.value = 0.95;
    targets.forEach((target) => { target.dirty = true; });
    screenGlow.color.setHSL(h, 0.7, 0.75, srgb);
    deskGlow.color.set(cssColor('--accent2', '#a48af0'));
    if (light) deskGlow.color.offsetHSL(0, 0, 0.3);
    pendants.intensity = light ? 0.9 : 2.6;
    deskKey.intensity = light ? 0.7 : 2.6;
    glowBase = light ? 0.6 : 2.2;
    screenGlow.intensity = glowBase * (tvOn ? 2 : 1);
    deskGlow.intensity = shared.ledMode === 'off' ? 0 : light ? 0.4 : 1.6;
    features.forEach((feature) => feature.theme?.());
  }

  function grade(material: THREE.MeshStandardMaterial, tint: THREE.Color, saturation: { value: number }) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.gradeTint = { value: tint };
      shader.uniforms.gradeSaturation = saturation;
      shader.fragmentShader = 'uniform vec3 gradeTint;\nuniform float gradeSaturation;\n' + shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n\tdiffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722))), diffuseColor.rgb, gradeSaturation) * gradeTint;');
    };
    material.customProgramCacheKey = () => 'room-grade';
    material.needsUpdate = true;
  }

  function aim(angle: number, height = lift) {
    camera.position.set(OFFSET.x, OFFSET.y * height, OFFSET.z).applyAxisAngle(UP, angle).add(look);
    camera.lookAt(look);
    camera.updateMatrixWorld();
  }

  function place() {
    aim(yaw);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }

  function resize() {
    const frameEl = exploring ? stage : host;
    const width = frameEl.clientWidth, height = frameEl.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(slow ? Math.min(1, 320 / Math.max(width, height)) : Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    if (loaded) {
      const saved = look.clone();
      look.copy(center);
      let x = 0, y = 0;
      for (const angle of [-YAW, 0, YAW]) {
        aim(angle, 1);
        const inverse = camera.matrixWorldInverse;
        const middle = center.clone().applyMatrix4(inverse);
        for (const bx of [bounds.min.x, bounds.max.x]) for (const by of [bounds.min.y, bounds.max.y]) for (const bz of [bounds.min.z, bounds.max.z]) {
          const point = new THREE.Vector3(bx, by, bz).applyMatrix4(inverse).sub(middle);
          x = Math.max(x, Math.abs(point.x));
          y = Math.max(y, Math.abs(point.y));
        }
      }
      look.copy(saved);
      const aspect = width / height;
      const half = Math.max(y, x / aspect) * 1.04;
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      if (activity) frameActivity();
      place();
    }
    start();
  }

  function schedule() {
    if (!frame && (visible || exploring) && !document.hidden && !disposed && loaded) frame = requestAnimationFrame(render);
  }
  const start = schedule;

  function pickAt(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((clientX - rect.left) / rect.width * 2 - 1, 1 - (clientY - rect.top) / rect.height * 2);
    ray.setFromCamera(pointer, camera);
    const entry = new THREE.Vector3();
    const candidates: { target: Target; distance: number }[] = [];
    for (const target of targets) {
      if (ray.ray.intersectBox(target.box, entry)) candidates.push({ target, distance: entry.distanceTo(ray.ray.origin) });
    }
    candidates.sort((a, b) => a.distance - b.distance);
    let best: Target | null = null, nearest = Infinity;
    for (const { target, distance } of candidates) {
      if (distance > nearest) break;
      const hit = target.loose ? distance : ray.intersectObjects(target.meshes, false)[0]?.distance;
      if (hit !== undefined && hit < nearest) { nearest = hit; best = target; }
    }
    return best?.label ? best : null;
  }

  function label(target: Target | null) {
    if (!target) return '';
    if (target.hover) return target.hover();
    if (!exploring) return target.label;
    if (target.kind === 'light') return `${target.label} · turn ${target.off ? 'on' : 'off'}`;
    if (target.kind === 'tv') return `${target.label} · ${tvOn ? 'TV off' : 'TV on'}`;
    return target.label;
  }

  function action(target: Target) {
    if (target.actionText) return target.actionText();
    if (target.kind === 'piano' || target.kind === 'computer') return 'Sit and ' + ACTIVITY_LABEL[target.kind].toLowerCase();
    if (target.kind === 'seat') return target.seat?.activities.includes('tv') ? 'Sit and watch TV' : 'Sit down';
    if (target.kind === 'tv') return tvOn ? 'Turn the TV off' : 'Turn the TV on';
    if (target.kind === 'laptop') return laptopState === 'open' ? 'Close the laptop' : laptopState === 'closed' ? 'Pick up the laptop' : 'Put the laptop down';
    if (target.kind === 'light') return `Turn ${target.off ? 'on' : 'off'} the ${target.label.toLowerCase()}`;
    return 'Inspect ' + target.label;
  }

  function showNote(label: string, text: string) {
    const title = document.createElement('strong');
    title.textContent = label;
    const body = document.createElement('span');
    body.textContent = text;
    card.replaceChildren(title, body);
    card.classList.add('on');
  }

  function showCard(target: Target, note = '') {
    showNote(target.label, note || opts.details?.[target.label] || opts.details?.[target.label.split(' · ')[0]] || target.detail);
    carded = target;
  }

  function hideCard() {
    card.classList.remove('on');
    carded = null;
  }

  const laptop = () => targets.find((target) => target.object.name === 'secondary_laptop');

  function setOff(target: Target, off: boolean) {
    target.off = off;
    target.dirty = true;
    for (const { material } of target.materials) if (target.kind === 'laptop' && material.emissiveMap) material.color.setScalar(off ? 0.06 : 1);
    if (target.object.name === 'room_pendants') pendants.visible = !off;
  }

  function setTv(on: boolean) {
    if (!tvScreen || tvOn === on) return;
    tvOn = on;
    if (on) movie.start(performance.now());
    tvScreen.material.emissiveMap = on ? movie.texture : tvScreen.map;
    tvScreen.material.emissiveIntensity = on ? Math.max(1.2, tvScreen.intensity * 0.8) : tvScreen.intensity;
    tvScreen.material.needsUpdate = true;
    screenGlow.intensity = glowBase * (on ? 2 : 1);
    host.dataset.roomTv = on ? 'on' : 'off';
    if (seat) renderSeat();
    start();
  }

  function use(target: Target) {
    const kind = target.kind;
    const move = kind !== 'seat' && kind !== 'piano' && kind !== 'computer' && !(skin && kind === 'laptop') ? gestureFor(target) : null;
    if (move) rig?.trigger(move);
    if (target.use) {
      showCard(target, target.use() || '');
      start();
      return;
    }
    if ((kind === 'piano' || kind === 'computer') && chair) sit(chair, kind);
    else if (kind === 'seat') sit(target, target.seat?.activities.includes('tv') ? 'tv' : null);
    else if (kind === 'tv') {
      setTv(!tvOn);
      showCard(target, tvOn ? 'TV on · a slideshow of the artworks from this page' : 'TV off');
    } else if (kind === 'laptop') {
      const desk = laptop();
      const was = laptopState;
      laptopState = laptopState === 'open' ? 'closed' : laptopState === 'closed' ? 'carried' : 'open';
      if (skin && desk && (laptopState === 'carried' || was === 'carried')) {
        const carry = laptopState === 'carried';
        if (carry) setOff(desk, true);
        else lidGoal = 1;
        alignForLaptop(desk);
        skin.laptop(carry, () => {
          desk.object.visible = !carry;
          if (!carry) { setOff(desk, false); lidGoal = 0; }
          start();
        });
      } else {
        if (desk) { setOff(desk, laptopState !== 'open'); desk.object.visible = laptopState !== 'carried'; }
        if (handLaptop) handLaptop.visible = laptopState === 'carried';
        lidGoal = laptopState === 'open' ? 0 : 1;
      }
      showCard(target, laptopState === 'open' ? 'MSI Modern 14 · open and awake' : laptopState === 'closed' ? 'MSI Modern 14 · lid closed' : 'MSI Modern 14 · in your hand');
    } else if (kind === 'light') {
      setOff(target, !target.off);
      showCard(target, target.off ? 'Off' : 'On');
    } else showCard(target);
    start();
  }

  function returnLaptop() {
    if (laptopState !== 'carried' && !skin?.busy) return;
    laptopState = 'open';
    skin?.drop();
    const desk = laptop();
    if (desk) { desk.object.visible = true; setOff(desk, false); }
    if (handLaptop) handLaptop.visible = false;
    lidGoal = 0;
  }

  function alignForLaptop(desk: Target) {
    const grip = skin && handLaptopContact;
    if (!grip) return;
    const cx = (desk.rect.x0 + desk.rect.x1) / 2, cz = (desk.rect.z0 + desk.rect.z1) / 2;
    const yaw = Math.atan2(cx - px, cz - pz) - Math.atan2(grip.x, grip.z);
    const s = Math.sin(yaw), c = Math.cos(yaw);
    const x = cx - (grip.x * c + grip.z * s), z = cz - (-grip.x * s + grip.z * c);
    if (rects.some((rect) => rect !== desk.rect && rectDistance(x, z, rect) < RADIUS)) { facing.set(Math.sin(yaw), Math.cos(yaw)); return; }
    px = x;
    pz = z;
    facing.set(Math.sin(yaw), Math.cos(yaw));
    heading = yaw;
  }

  function gestureFor(target: Target): Gesture | null {
    if (target.gesture) return target.gesture();
    if (/plant/i.test(target.label ?? '')) return 'water';
    if (target.deck) return 'press';
    if (target.kind === 'light' || target.kind === 'tv' || target.kind === 'laptop' || /lamp|light|switch/i.test(target.label ?? '')) return 'press';
    return 'inspect';
  }

  function face(x: number, z: number) {
    if (Math.hypot(x - px, z - pz) > 1e-3) facing.set(x - px, z - pz).normalize();
  }

  function yawFacing(x: number, z: number) {
    return Math.atan2(x, z) - Math.atan2(OFFSET.x, OFFSET.z);
  }

  function renderSeat() {
    const active = seatPanel.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.act : undefined;
    if (!seat?.seat || sitGoal === 0) {
      seatPanel.hidden = true;
      if (active) stage.focus({ preventScroll: true });
      return;
    }
    const head = document.createElement('header');
    const title = document.createElement('strong');
    const meta = document.createElement('span');
    const hint = document.createElement('p');
    const row = document.createElement('div');
    const tag = (text: string, on = false) => {
      const chip = document.createElement('small');
      chip.textContent = text;
      if (on) chip.className = 'on';
      meta.append(chip);
    };
    const button = (text: string, act: string, pressed?: boolean, into: HTMLElement = row) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.dataset.act = act;
      element.textContent = text;
      if (pressed !== undefined) element.setAttribute('aria-pressed', String(pressed));
      into.append(element);
      return element;
    };
    if (activity === 'piano' && piano) {
      title.textContent = 'Piano';
      tag(`${noteName(piano.base)}–${noteName(piano.base + 16)}`);
      tag(`Sustain ${piano.pedal ? 'on' : 'off'}`, piano.pedal);
      hint.className = 'room-seat-keys';
      const down = piano.down();
      for (const { key, midi } of keyLegend(piano.base)) {
        const cell = document.createElement('kbd');
        cell.textContent = key;
        cell.title = noteName(midi);
        cell.dataset.midi = String(midi);
        if ([1, 3, 6, 8, 10].includes(midi % 12)) cell.className = 'sharp';
        if (down.includes(midi)) cell.classList.add('on');
        hint.append(cell);
      }
      const tips = document.createElement('span');
      tips.className = 'room-seat-tip';
      tips.textContent = 'Z/X octave · Space sustain · tap or slide on the keys · Esc steps back';
      hint.append(tips);
      const octave = document.createElement('span');
      octave.className = 'room-seat-group';
      octave.setAttribute('role', 'group');
      octave.setAttribute('aria-label', 'Octave');
      button('Oct −', 'octave-down', undefined, octave);
      button('Oct +', 'octave-up', undefined, octave);
      row.append(octave);
      button('Sustain', 'sustain', piano.pedal);
    } else if (activity === 'computer') {
      title.textContent = 'Computer';
      tag('Desktop');
      hint.textContent = 'Double-click or Enter to open apps · Esc steps back';
    } else if (activity === 'tv') {
      title.textContent = 'TV';
      tag(tvOn ? 'Artwork slideshow' : 'Off', tvOn);
      hint.textContent = 'A slideshow of the artworks on this page · Esc steps back';
      button(tvOn ? 'TV off' : 'TV on', 'tv-toggle');
    } else {
      title.textContent = seat.label;
      tag('Seated');
      hint.textContent = 'E, Esc or a move key to stand up';
      for (const option of seat.seat.activities) button(ACTIVITY_LABEL[option], option).className = 'primary';
    }
    button('Stand up', 'stand');
    head.append(title, meta);
    seatPanel.replaceChildren(head, hint, row);
    seatPanel.hidden = false;
    if (active) (seatPanel.querySelector<HTMLElement>(`[data-act="${active}"]`) ?? seatPanel.querySelector<HTMLElement>('button'))?.focus({ preventScroll: true });
  }

  let pianoKey = '';
  function onPiano() {
    if (!piano) return;
    host.dataset.roomSustain = piano.pedal ? 'on' : 'off';
    const next = `${piano.base}:${piano.pedal}`;
    if (next !== pianoKey) {
      pianoKey = next;
      if (activity === 'piano') renderSeat();
    }
    start();
  }

  function frameActivity() {
    if (!activity || !model) {
      yawGoal = yawBefore;
      liftGoal = 1;
      zoomGoal = viewZoom;
      return;
    }
    const box = new THREE.Box3();
    if (activity === 'piano') { if (piano) box.copy(piano.bounds()); }
    else {
      const node = activity === 'computer' ? model.getObjectByName('lg_screen') : tv?.object;
      if (node) box.setFromObject(node);
    }
    box.getCenter(lookGoal);
    const size = box.getSize(new THREE.Vector3());
    const width = Math.hypot(size.x, size.z), height = Math.max(size.y, 0.05);
    const narrow = stage.clientWidth < 700;
    const fill = activity === 'computer' ? (narrow ? 0.92 : 0.62) : activity === 'piano' ? (narrow ? 0.96 : 0.8) : (narrow ? 0.9 : 0.56);
    zoomGoal = Math.min((camera.right - camera.left) * fill / width, (camera.top - camera.bottom) * 0.62 / height, 14);
    const back = seat?.seat;
    yawGoal = activity === 'tv' || !back ? yawFacing(0, 1) * 0.8 : yawFacing(-Math.sin(back.heading), -Math.cos(back.heading));
    liftGoal = activity === 'piano' ? 5 : 1;
  }

  function setActivity(next: Activity | null) {
    if (next === activity) return;
    if (activity === 'piano') { piano?.releaseAll(); pianoPointers.clear(); }
    if (!activity) yawBefore = yawGoal;
    activity = next;
    features.forEach((feature) => feature.activity?.(next));
    piano?.show(next === 'piano');
    if (next === 'tv') setTv(true);
    screen.hidden = next !== 'computer';
    screenKey = '';
    host.dataset.roomActivity = next ?? '';
    stage.dataset.activity = next ?? '';
    setHover(null, 0, 0);
    framePending = next === 'piano' && !!piano && !piano.extended;
    if (!framePending) frameActivity();
    renderSeat();
    start();
  }

  function sit(target: Target, next: Activity | null) {
    if (!target.seat) return;
    if (seat !== target) {
      if (seat) standUp(true);
      seat = target;
      sitGoal = 1;
      route = [];
      routeTarget = null;
      pinned = null;
      facing.set(Math.sin(target.seat.heading), Math.cos(target.seat.heading));
      host.dataset.roomSeat = target.label;
      stage.dataset.seated = '';
      prompt.hidden = true;
      prompt.dataset.text = '';
    }
    hideCard();
    setActivity(next);
    renderSeat();
  }

  function standUp(instant = false) {
    if (!seat) return;
    setActivity(null);
    sitGoal = 0;
    if (instant) { sitting = 0; seat = null; }
    host.dataset.roomSeat = '';
    delete stage.dataset.seated;
    renderSeat();
    start();
  }

  function walkTo(target: Target | null, point?: THREE.Vector3) {
    if (!grid) return;
    hideCard();
    if (seat) standUp();
    pinned = null;
    const destination = target && (target.kind === 'piano' || target.kind === 'computer') && chair ? chair : target;
    let path: [number, number][] | null = null;
    const anchor = destination?.seat;
    if (anchor) {
      for (const reach of [0.5, 0.65, 0.85]) {
        const goal = (x: number, z: number) => Math.hypot(x - anchor.x, z - anchor.z) < reach;
        path = goal(px, pz) ? [] : grid.path(px, pz, goal);
        if (path) break;
      }
    }
    if (destination && !path) {
      for (const reach of [RADIUS + 0.14, REACH, REACH + 0.25, REACH + 0.65]) {
        const goal = (x: number, z: number) => rectDistance(x, z, destination.rect) < reach;
        path = goal(px, pz) ? [] : grid.path(px, pz, goal);
        if (path) break;
      }
    } else if (!destination) {
      const { x, z } = point!;
      path = grid.path(px, pz, (cx, cz) => Math.hypot(cx - x, cz - z) < 0.08) ?? grid.path(px, pz, (cx, cz) => Math.hypot(cx - x, cz - z) < 0.4);
    }
    if (!path) {
      if (target) showCard(target, 'No way to reach that from here');
      return;
    }
    route = path;
    routeTarget = target;
    stuck = 0;
    if (!path.length && target) arrive(target);
    start();
  }

  function arrive(target: Target) {
    routeTarget = null;
    pinned = target;
    near = target;
    face((target.rect.x0 + target.rect.x1) / 2, (target.rect.z0 + target.rect.z1) / 2);
    use(target);
  }

  function updateExplore(dt: number, animate: boolean) {
    const fx = look.x - camera.position.x, fz = look.z - camera.position.z, fl = Math.hypot(fx, fz) || 1;
    const ux = fx / fl, uz = fz / fl, rx = -uz, rz = ux;
    let ix = stick.x, iy = stick.y;
    if (held.has('right')) ix += 1;
    if (held.has('left')) ix -= 1;
    if (held.has('up')) iy += 1;
    if (held.has('down')) iy -= 1;
    const blend = (rate: number) => animate ? 1 - Math.exp(-dt * rate) : 1;
    let mx = 0, mz = 0, distance = SPEED * dt * (running ? 1.7 : 1);
    const amount = Math.hypot(ix, iy);
    if (amount > 0.08 && seat && sitGoal === 1) standUp();
    if (seat) {
      sitting += (sitGoal - sitting) * blend(7);
      if (Math.abs(sitGoal - sitting) < 0.01) sitting = sitGoal;
      if (sitting === 0 && sitGoal === 0) seat = null;
    } else if (amount > 0.08) {
      route = [];
      routeTarget = null;
      const k = Math.min(1, amount) / amount;
      mx = (ux * iy + rx * ix) * k;
      mz = (uz * iy + rz * ix) * k;
      distance *= Math.hypot(mx, mz);
    } else if (route.length) {
      const [wx, wz] = route[0];
      const d = Math.hypot(wx - px, wz - pz);
      if (d < 0.02) route.shift();
      else { mx = (wx - px) / d; mz = (wz - pz) / d; distance = Math.min(distance, d); }
      if (!route.length && routeTarget) arrive(routeTarget);
    }
    let moving = false;
    const length = Math.hypot(mx, mz);
    if (length > 1e-6 && distance > 0) {
      const [nx, nz] = step(px, pz, mx / length * distance, mz / length * distance, RADIUS, rects, area);
      moving = Math.hypot(nx - px, nz - pz) > 1e-4;
      if (moving) { stuck = 0; pinned = null; }
      else if (route.length && ++stuck > 12) { route = []; routeTarget = null; }
      px = nx;
      pz = nz;
      facing.set(mx, mz).normalize();
    }
    const turn = Math.atan2(facing.x, facing.y), delta = Math.atan2(Math.sin(turn - heading), Math.cos(turn - heading));
    heading += delta * blend(14);
    stride += ((moving && animate ? 1 : 0) - stride) * blend(12);
    const k = sitting * sitting * (3 - 2 * sitting);
    const down = activity === 'piano' ? piano?.down() ?? [] : [];
    const aimAt = near && !seat ? Math.atan2((near.rect.x0 + near.rect.x1) / 2 - px, (near.rect.z0 + near.rect.z1) / 2 - pz) - heading : 0;
    const pose = rig?.update({
      dt, now: performance.now() / 1000, animate, speed: moving ? (running ? 2 : 1) : 0, sitting,
      recline: !!seat?.seat?.activities.includes('tv'), activity, keys: down.length,
      keySide: down.length ? Math.max(-1, Math.min(1, (down.reduce((a, b) => a + b, 0) / down.length - 64) / 44)) : 0,
      typing: activity === 'computer' && performance.now() - typedAt < 400, playing: shared.vinyl, carry: carrying,
      look: Math.atan2(Math.sin(aimAt), Math.cos(aimAt)), clip: !!skin,
    });
    skin?.update(animate ? dt : 1, moving && animate, running);
    player.rotation.y = heading;
    const anchor = seat?.seat;
    if (anchor) player.position.set(THREE.MathUtils.lerp(px, anchor.x, k), THREE.MathUtils.lerp(floorY, anchor.y + 0.01 - hip, k), THREE.MathUtils.lerp(pz, anchor.z, k));
    else player.position.set(px, floorY + (pose?.lift ?? 0), pz);
    shadow.visible = k < 0.5;
    const settling = Math.abs(delta) > 0.01 || stride > 0.01 || (!!seat && sitting !== sitGoal) || !!pose?.busy;

    let best: Target | null = null;
    if (!seat) {
      const reachX = px + facing.x * 0.3, reachZ = pz + facing.y * 0.3;
      let bestScore = Infinity;
      for (const target of targets) {
        if (!target.label) continue;
        const d = rectDistance(reachX, reachZ, target.rect);
        const score = d + 0.1 * Math.sqrt((target.rect.x1 - target.rect.x0) * (target.rect.z1 - target.rect.z0));
        if (d < REACH && score < bestScore) { bestScore = score; best = target; }
      }
      best = pinned ?? best;
    }
    if (best !== near) {
      near = best;
      if (carded && carded !== near && !route.length) hideCard();
    }
    const text = near && !seat && !route.length ? action(near) : '';
    if (prompt.dataset.text !== text) {
      prompt.dataset.text = text;
      const key = document.createElement('kbd');
      key.textContent = 'E';
      prompt.replaceChildren(key, text);
      prompt.hidden = !text;
    }
    host.dataset.roomNear = near?.label ?? '';
    host.dataset.roomPlayer = `${px.toFixed(2)},${pz.toFixed(2)}`;
    if (!focused && !activity) lookGoal.set(player.position.x, floorY + 0.9, player.position.z);
    return moving || settling || held.size > 0 || stick.id >= 0 || route.length > 0;
  }

  function zoomBy(factor: number) {
    viewZoom = THREE.MathUtils.clamp(viewZoom * factor, 1, 4.5);
    host.dataset.roomZoom = viewZoom.toFixed(2);
    if (activity) zoomGoal = THREE.MathUtils.clamp(zoomGoal * factor, 1, 16);
    else if (!focused) zoomGoal = viewZoom;
    start();
  }

  function releaseStick() {
    stick.id = -1;
    stick.x = stick.y = 0;
    knob.style.translate = '';
  }

  function clearInput() {
    held.clear();
    releaseStick();
    touches.clear();
    pianoPointers.clear();
    piano?.releaseAll();
  }

  function back() {
    if (activity) setActivity(null);
    else if (seat) standUp();
    else if (focused) focus(null);
    else if (carded) hideCard();
    else exitExplore();
  }

  function enterExplore() {
    if (!loaded || exploring || !grid) return;
    exploring = true;
    restoreFocus = document.activeElement as HTMLElement | null;
    const themed = host.closest<HTMLElement>('[data-theme]');
    if (themed) {
      stage.dataset.theme = themed.dataset.theme;
      for (const name of ['--accent', '--accent2', '--accent-soft', '--accent-ring']) stage.style.setProperty(name, themed.style.getPropertyValue(name));
    }
    document.body.append(stage);
    stage.prepend(canvas, tip);
    inertState = [...document.body.children].filter((el): el is HTMLElement => el !== stage && el instanceof HTMLElement).map((el) => [el, el.inert]);
    inertState.forEach(([el]) => { el.inert = true; });
    const root = document.documentElement;
    hadCursor = root.classList.contains('dc-cursor-on');
    root.classList.remove('dc-cursor-on');
    root.classList.add('room-locked');
    host.dataset.roomMode = 'play';
    setHover(null, 0, 0);
    focused = null;
    host.classList.remove('room-focused');
    host.dataset.roomFocus = '';
    zoomGoal = viewZoom;
    lookGoal.set(px, floorY + 0.9, pz);
    window.addEventListener('keydown', onPlayKey, true);
    window.addEventListener('keyup', onPlayKey, true);
    window.addEventListener('blur', clearInput);
    resize();
    stage.focus({ preventScroll: true });
  }

  function exitExplore() {
    if (!exploring) return;
    exploring = false;
    window.removeEventListener('keydown', onPlayKey, true);
    window.removeEventListener('keyup', onPlayKey, true);
    window.removeEventListener('blur', clearInput);
    clearInput();
    standUp(true);
    returnLaptop();
    updateExplore(0, false);
    setTv(false);
    route = [];
    routeTarget = null;
    near = null;
    pinned = null;
    hideCard();
    prompt.hidden = true;
    prompt.dataset.text = '';
    host.prepend(canvas);
    host.insertBefore(tip, enter);
    stage.remove();
    inertState.forEach(([el, was]) => { el.inert = was; });
    inertState = [];
    const root = document.documentElement;
    root.classList.remove('room-locked');
    if (hadCursor) root.classList.add('dc-cursor-on');
    host.dataset.roomMode = 'embed';
    host.dataset.roomNear = '';
    focus(null);
    resize();
    (restoreFocus?.isConnected ? restoreFocus : enter).focus({ preventScroll: true });
  }

  const onPlayKey = (event: KeyboardEvent) => {
    if (event.key === 'Tab') return;
    running = event.shiftKey;
    if (event.key === 'Escape' && screen.querySelector('[aria-expanded="true"]')) return;
    if (event.key !== 'Escape' && (event.target as Element | null)?.closest?.('.room-screen')) {
      if (event.type === 'keydown') typedAt = performance.now();
      return;
    }
    const control = (event.target as Element | null)?.closest?.('button, a, select, input');
    if (control?.matches('select, input') && event.key !== 'Escape') return;
    if (activity === 'piano' && piano && !event.ctrlKey && !event.metaKey && !event.altKey && piano.key(event)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const move = MOVES[event.code];
    if (event.type === 'keyup') {
      if (move) held.delete(move);
      return;
    }
    let handled = true;
    if (move) { held.add(move); start(); }
    else if (event.key === 'Escape') back();
    else if (event.code === 'Space' && !control && !seat && !near) { if (!event.repeat && rig?.trigger('jump')) start(); }
    else if (event.code === 'KeyQ' && !seat) { if (!event.repeat && rig?.trigger('wave')) start(); }
    else if (event.code === 'KeyE' || (!control && (event.key === 'Enter' || event.key === ' '))) {
      if (!event.repeat) {
        if (seat) standUp();
        else if (near) use(near);
      }
    }
    else if (event.key === '+' || event.key === '=') zoomBy(1.25);
    else if (event.key === '-' || event.key === '_') zoomBy(0.8);
    else handled = false;
    if (handled) event.preventDefault();
    if (handled || !control) event.stopImmediatePropagation();
  };

  const onStageClick = (event: MouseEvent) => {
    const button = (event.target as Element).closest('button');
    if (!button) return;
    if (button.dataset.zoom) zoomBy(button.dataset.zoom === '1' ? 1.25 : 0.8);
    else if (button.hasAttribute('data-exit')) exitExplore();
    else if (button === prompt && near) use(near);
    const act = button.dataset.act;
    if (act === 'stand') standUp();
    else if (act === 'piano' || act === 'computer' || act === 'tv') setActivity(act);
    else if (act === 'octave-down' || act === 'octave-up') piano?.octave(act === 'octave-up' ? 1 : -1);
    else if (act === 'sustain') piano?.sustain(!piano.pedal);
    else if (act === 'tv-toggle') setTv(!tvOn);
  };
  const onGoto = () => {
    const target = targets[Number(goto.value)];
    goto.value = '';
    if (target) walkTo(target);
  };
  const onWheel = (event: WheelEvent) => {
    if ((event.target as Element).closest('.room-screen')) return;
    event.preventDefault();
    zoomBy(Math.exp(-event.deltaY * 0.0015));
  };
  const onStick = (event: PointerEvent) => {
    if (event.type === 'pointerdown') {
      if (stick.id >= 0) return;
      stick.id = event.pointerId;
      try { stickPad.setPointerCapture(event.pointerId); } catch {}
    } else if (event.pointerId !== stick.id) return;
    if (event.type !== 'pointerdown' && event.type !== 'pointermove') { releaseStick(); return; }
    const rect = stickPad.getBoundingClientRect();
    const radius = rect.width / 2;
    let dx = (event.clientX - rect.left - radius) / radius, dy = (event.clientY - rect.top - radius) / radius;
    const length = Math.hypot(dx, dy);
    if (length > 1) { dx /= length; dy /= length; }
    stick.x = dx;
    stick.y = -dy;
    knob.style.translate = `${dx * radius * 0.55}px ${dy * radius * 0.55}px`;
    event.preventDefault();
    start();
  };
  const STICK_EVENTS = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture'];
  STICK_EVENTS.forEach((type) => stickPad.addEventListener(type, onStick as EventListener));
  stage.addEventListener('click', onStageClick);
  stage.addEventListener('wheel', onWheel, { passive: false });
  goto.addEventListener('change', onGoto);
  enter.addEventListener('click', enterExplore);

  function showTip(text: string, clientX: number, clientY: number) {
    if (tip.textContent !== text) tip.textContent = text;
    tip.classList.toggle('on', !!text);
    if (!text) return;
    const rect = canvas.getBoundingClientRect();
    const x = THREE.MathUtils.clamp(clientX - rect.left + 14, 6, Math.max(6, rect.width - tip.offsetWidth - 6));
    const y = THREE.MathUtils.clamp(clientY - rect.top + 14, 6, Math.max(6, rect.height - tip.offsetHeight - 6));
    tip.style.transform = `translate(${x}px,${y}px)`;
  }

  function setHover(target: Target | null, clientX: number, clientY: number) {
    const zone = target?.zone ?? -1;
    if ((hovered?.zone ?? -1) !== zone) opts.onHover(zone);
    hovered = target;
    showTip(label(target), clientX, clientY);
    canvas.style.cursor = dragging ? 'grabbing' : target ? 'pointer' : 'grab';
  }

  const screenBox = new THREE.Box3();
  function placeScreen() {
    const rect = canvas.getBoundingClientRect();
    const project = (x: number, y: number, z: number) => {
      const point = new THREE.Vector3(x, y, z).project(camera);
      return [(point.x + 1) / 2 * rect.width, (1 - point.y) / 2 * rect.height];
    };
    const { min, max } = screenBox;
    const [ax, ay] = project(max.x, max.y, min.z), [bx, by] = project(max.x, max.y, max.z), [cx, cy] = project(max.x, min.y, min.z);
    const w = Math.hypot(bx - ax, by - ay), h = Math.hypot(cx - ax, cy - ay);
    const key = [ax, ay, bx, by, cx, cy].map((value) => value.toFixed(1)).join();
    if (key === screenKey || w < 1 || h < 1) return;
    screenKey = key;
    screen.style.width = `${w}px`;
    screen.style.height = `${h}px`;
    screen.style.transform = `matrix(${(bx - ax) / w},${(by - ay) / w},${(cx - ax) / h},${(cy - ay) / h},${ax},${ay})`;
  }

  function focus(target: Target | null) {
    focused = target;
    if (target) {
      const size = target.box.getSize(new THREE.Vector3());
      target.box.getCenter(lookGoal);
      zoomGoal = THREE.MathUtils.clamp(camera.top / (Math.max(size.x, size.y, size.z) * 1.5), 1.25, 3);
    } else if (exploring) {
      zoomGoal = viewZoom;
    } else {
      lookGoal.copy(center);
      zoomGoal = 1;
    }
    host.classList.toggle('room-focused', !!target);
    host.dataset.roomFocus = target?.label ?? '';
    start();
  }

  function render(now: number) {
    frame = 0;
    if (!(visible || exploring) || document.hidden || disposed || !loaded) return;
    const cap = slow ? 100 : dragging || exploring ? 0 : 33;
    if (now - drawn < cap) { schedule(); return; }
    const dt = lastTime ? Math.min(0.5, (now - lastTime) / 1000) : 0;
    lastTime = now;
    const { active } = opts.get();
    const playing = shared.vinyl;
    const animate = !motion.matches && !slow;
    const ease = animate ? 1 - Math.exp(-dt * 10) : 1;
    let busy = false;

    if (exploring) {
      const steps = Math.max(1, Math.ceil(dt / 0.05));
      for (let i = 0; i < steps; i++) if (updateExplore(dt / steps, animate)) busy = true;
    }

    yaw += (yawGoal - yaw) * ease;
    zoom += (zoomGoal - zoom) * ease;
    lift += (liftGoal - lift) * ease;
    look.lerp(lookGoal, ease);
    if (Math.abs(yawGoal - yaw) > 1e-4 || Math.abs(zoomGoal - zoom) > 1e-4 || Math.abs(liftGoal - lift) > 1e-4 || look.distanceToSquared(lookGoal) > 1e-8) busy = true;
    else { yaw = yawGoal; zoom = zoomGoal; lift = liftGoal; look.copy(lookGoal); }
    place();
    if (activity === 'computer') placeScreen();

    if (hoverAt && !dragging && !activity) {
      setHover(pickAt(hoverAt.x, hoverAt.y), hoverAt.x, hoverAt.y);
      hoverAt = null;
    }

    for (const target of targets) {
      const goal = target === hovered || target === focused ? 1 : target.zone === active ? 0.3 : 0;
      if (Math.abs(goal - target.glow) < 0.004) {
        if (target.glow === goal && !target.dirty) continue;
        target.glow = goal;
      } else {
        target.glow += (goal - target.glow) * (animate ? 1 - Math.exp(-dt * 14) : 1);
        busy = true;
      }
      target.dirty = false;
      for (const { material, color } of target.materials) material.emissive.copy(color).multiplyScalar(target.off ? 0.04 : 1).add(tint.copy(accent).multiplyScalar(target.glow * 0.32));
    }
    if (piano) {
      if (piano.update(dt, animate, !motion.matches)) busy = true;
      if (framePending && piano.extended) { framePending = false; if (activity === 'piano') { frameActivity(); busy = true; } }
      const keys = piano.down().join(' ');
      if (host.dataset.roomKeys !== keys) {
        host.dataset.roomKeys = keys;
        const held = new Set(keys.split(' '));
        seatPanel.querySelectorAll<HTMLElement>('kbd[data-midi]').forEach((cell) => cell.classList.toggle('on', held.has(cell.dataset.midi!)));
      }
      host.dataset.roomVoices = String(piano.voices);
    }
    if (lid && lidT !== lidGoal) {
      lidT = animate ? lidT + Math.sign(lidGoal - lidT) * Math.min(Math.abs(lidGoal - lidT), dt * 2.5) : lidGoal;
      const e = lidT * lidT * (3 - 2 * lidT);
      lid.quaternion.slerpQuaternions(lidOpen, lidShut, e);
      lid.position.y = lidY + 0.011 * e;
      busy = true;
    }
    if (tvOn) {
      movie.draw(now, animate);
      busy = true;
    }
    const desk = shared.ledMode === 'off' ? 0 : isLight() ? 0.4 : 1.6;
    if (deskGlow.intensity !== desk) deskGlow.intensity = desk;
    const info = { now, dt, animate, playing, active, exploring, activity };
    for (const feature of features) if (feature.frame?.(info)) busy = true;

    const continuous = playing && animate;
    if (hovered?.deck && playing !== lastPlaying) tip.textContent = label(hovered);

    renderer.render(scene, camera);
    drawn = now;
    lastPlaying = playing;
    lastActive = active;
    host.dataset.roomDrawCalls = String(renderer.info.render.calls);
    host.dataset.roomTriangles = String(renderer.info.render.triangles);
    if ((continuous || (exploring && busy)) && probeStart >= 0) {
      if (!probeStart) probeStart = now + 800;
      else if (now > probeStart) {
        probeFrames++;
        if (now - probeStart >= 1200) {
          const fps = probeFrames / ((now - probeStart) / 1000);
          if (fps < 15) {
            slow = true;
            host.dataset.roomQuality = 'still';
            resize();
          }
          probeStart = -1;
        }
      }
    }
    if (busy) schedule();
    else lastTime = 0;
  }

  const pollState = window.setInterval(() => {
    if (opts.get().active !== lastActive) start();
  }, 100);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    lastTime = 0;
    if (probeStart > 0) { probeStart = 0; probeFrames = 0; }
    if (visible) start();
    else if (!exploring) { cancelAnimationFrame(frame); frame = 0; }
  });
  intersection.observe(host);
  let themeKey = '';
  const themeObserver = new MutationObserver(() => {
    const next = cssColor('--accent', '#7d97ec') + host.closest('[data-theme]')?.getAttribute('data-theme');
    if (next === themeKey) return;
    themeKey = next;
    readAccent();
    start();
  });
  const themed = host.closest('[data-theme]');
  if (themed) themeObserver.observe(themed, { attributes: true, attributeFilter: ['data-theme', 'style'] });
  const onVisibility = () => {
    lastTime = 0;
    if (probeStart > 0) { probeStart = 0; probeFrames = 0; }
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; clearInput(); }
    else start();
  };
  document.addEventListener('visibilitychange', onVisibility);
  motion.addEventListener('change', start);

  const endPress = (event: PointerEvent, cancelled: boolean) => {
    if (pianoPointers.delete(event.pointerId)) piano?.lift(event.pointerId);
    touches.delete(event.pointerId);
    if (!press || event.pointerId !== press.id) return;
    suppressClick = dragging && !cancelled;
    press = null;
    if (dragging) {
      dragging = false;
      host.classList.remove('room-dragging');
      canvas.style.cursor = 'grab';
      start();
    }
  };
  const pianoAt = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set((clientX - rect.left) / rect.width * 2 - 1, 1 - (clientY - rect.top) / rect.height * 2);
    ray.setFromCamera(pointer, camera);
    return piano?.pick(ray) ?? null;
  };
  const onDown = (event: PointerEvent) => {
    if (!loaded || event.button !== 0) return;
    if (activity === 'piano' && piano) {
      const midi = pianoAt(event.clientX, event.clientY);
      if (midi === null) return;
      pianoPointers.add(event.pointerId);
      try { canvas.setPointerCapture(event.pointerId); } catch {}
      piano.touch(event.pointerId, midi);
      event.preventDefault();
      return;
    }
    if (activity) return;
    if (exploring && event.pointerType === 'touch') {
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.size === 2) {
        const [a, b] = [...touches.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        pinchZoom = viewZoom;
        press = null;
        dragging = false;
        suppressClick = true;
        return;
      }
    }
    if (press) return;
    suppressClick = false;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: yawGoal };
  };
  const onMove = (event: PointerEvent) => {
    if (!loaded) return;
    if (pianoPointers.has(event.pointerId)) {
      piano?.touch(event.pointerId, pianoAt(event.clientX, event.clientY));
      return;
    }
    if (activity) return;
    if (touches.has(event.pointerId)) {
      touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touches.size === 2) {
        const [a, b] = [...touches.values()];
        viewZoom = THREE.MathUtils.clamp(pinchZoom * Math.hypot(a.x - b.x, a.y - b.y) / pinchStart, 1, 4.5);
        host.dataset.roomZoom = viewZoom.toFixed(2);
        if (!focused) zoomGoal = viewZoom;
        start();
        return;
      }
    }
    if (press && event.pointerId === press.id) {
      const dx = event.clientX - press.x, dy = event.clientY - press.y;
      if (!dragging && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
        dragging = true;
        canvas.setPointerCapture(event.pointerId);
        host.classList.add('room-dragging');
        setHover(null, event.clientX, event.clientY);
      }
      if (dragging) {
        yawGoal = THREE.MathUtils.clamp(press.yaw - dx * 0.005, -YAW, YAW);
        start();
        return;
      }
    }
    if (event.pointerType === 'touch') return;
    hoverAt = { x: event.clientX, y: event.clientY };
    start();
  };
  const onUp = (event: PointerEvent) => endPress(event, false);
  const onCancel = (event: PointerEvent) => endPress(event, true);
  const onLeave = (event: PointerEvent) => {
    if (dragging) return;
    hoverAt = null;
    setHover(null, event.clientX, event.clientY);
    start();
  };
  let tipTimer = 0;
  const onClick = (event: MouseEvent) => {
    if (!loaded) return;
    if (suppressClick) { suppressClick = false; return; }
    if (activity) return;
    place();
    const target = pickAt(event.clientX, event.clientY);
    if (exploring) {
      if (target) walkTo(target);
      else if (ray.ray.intersectPlane(floorPlane, new THREE.Vector3())) walkTo(null, ray.ray.intersectPlane(floorPlane, new THREE.Vector3())!);
      return;
    }
    let note = '';
    if (target?.use) { note = target.use() || label(target); start(); }
    else focus(target && target !== focused ? target : null);
    const touch = (event as PointerEvent).pointerType === 'touch';
    if (touch || target?.deck || note) {
      showTip(note || (target?.deck ? label(target) : target?.label ?? ''), event.clientX, event.clientY);
      clearTimeout(tipTimer);
      if (touch) tipTimer = window.setTimeout(() => tip.classList.remove('on'), 1800);
    }
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && focused && !exploring) focus(null);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);
  canvas.addEventListener('lostpointercapture', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerenter', readAccent);
  canvas.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);

  function release(object: THREE.Object3D) {
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    object.traverse((node) => {
      if (!(node instanceof THREE.Mesh || node instanceof THREE.Sprite)) return;
      if (node instanceof THREE.Mesh) node.geometry.dispose();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
    });
    materials.forEach((material) => {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    });
    textures.forEach((texture) => {
      if (texture.image instanceof ImageBitmap) texture.image.close();
      texture.dispose();
    });
  }

  function batch(root: THREE.Object3D, boundaries: Set<THREE.Object3D>) {
    const discarded = new Set<THREE.BufferGeometry>();
    for (const group of [root, ...boundaries]) {
      const inverse = group.matrixWorld.clone().invert();
      const batches = new Map<string, { material: THREE.Material; meshes: THREE.Mesh[] }>();
      const visit = (node: THREE.Object3D) => {
        if (node !== group && boundaries.has(node)) return;
        if (node !== group && node instanceof THREE.Mesh && !Array.isArray(node.material) && node.children.length === 0) {
          const geometry = node.geometry;
          const signature = Object.keys(geometry.attributes).map((name) => {
            const attribute = geometry.getAttribute(name);
            return `${name}:${attribute.itemSize}:${attribute.normalized}`;
          }).sort().join(',');
          const key = `${node.material.uuid}:${signature}`;
          if (!batches.has(key)) batches.set(key, { material: node.material, meshes: [] });
          batches.get(key)!.meshes.push(node);
        }
        node.children.forEach(visit);
      };
      visit(group);
      for (const { material, meshes } of batches.values()) {
        if (meshes.length < 2) continue;
        const pieces = meshes.map((mesh) => {
          const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
          for (const name of ['position', 'normal', 'tangent']) {
            const attribute = geometry.getAttribute(name);
            if (!attribute || attribute.array instanceof Float32Array) continue;
            const values = new Float32Array(attribute.count * attribute.itemSize);
            for (let i = 0; i < attribute.count; i++) {
              for (let k = 0; k < attribute.itemSize; k++) values[i * attribute.itemSize + k] = attribute.getComponent(i, k);
            }
            geometry.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize));
          }
          geometry.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
          return geometry;
        });
        const geometry = mergeGeometries(pieces);
        pieces.forEach((piece) => piece.dispose());
        if (!geometry) continue;
        const merged = new THREE.Mesh(geometry, material);
        merged.name = `${group.name}_static`;
        group.add(merged);
        meshes.forEach((mesh) => {
          discarded.add(mesh.geometry);
          mesh.removeFromParent();
        });
      }
    }
    return discarded;
  }

  const modelUrl = new URL('models/studio-room.glb', new URL(import.meta.env.BASE_URL, location.origin));
  fetch(modelUrl, { signal: abort.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`Room asset: HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => Promise.all([
      loader.parseAsync(data, new URL('.', modelUrl).href),
      loader.loadAsync(new URL('adele-30.glb', modelUrl).href).catch((error) => { console.error('Vinyl set:', error); return null; }),
    ]))
    .then(([gltf, vinyl]) => {
      if (disposed && vinyl) release(vinyl.scene);
      if (disposed) { release(gltf.scene); return; }
      model = gltf.scene;
      const required = ['studio_desk', 'turntable', 'vinyl_record', 'tonearm', 'lg_screen'];
      if (required.some((name) => !model!.getObjectByName(name))) throw new Error('Room asset is missing interaction targets');
      world.add(model);
      model.updateMatrixWorld(true);
      bounds.setFromObject(model);
      bounds.getCenter(center);
      look.copy(center);
      lookGoal.copy(center);

      const down = new THREE.Raycaster();
      const floorHits: number[] = [];
      for (let i = 1; i < 5; i++) for (let k = 1; k < 5; k++) {
        down.set(new THREE.Vector3(THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, i / 5), bounds.max.y + 1, THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, k / 5)), new THREE.Vector3(0, -1, 0));
        const hit = down.intersectObject(model, true)[0];
        if (hit) floorHits.push(hit.point.y);
      }
      floorY = floorHits.length ? Math.min(...floorHits) : bounds.min.y;
      floorPlane.constant = -floorY;
      const footprint = new THREE.Box3();
      const roomArea = (bounds.max.x - bounds.min.x) * (bounds.max.z - bounds.min.z);
      const shells: THREE.Object3D[] = [];
      model.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
        footprint.copy(node.geometry.boundingBox!).applyMatrix4(node.matrixWorld);
        const w = footprint.max.x - footprint.min.x, d = footprint.max.z - footprint.min.z;
        if (w * d > roomArea * 0.4) { shells.push(node); return; }
        if (footprint.min.y > floorY + 0.95 || footprint.max.y < floorY + 0.08 || w * d < 0.0009) return;
        rects.push({ x0: footprint.min.x, z0: footprint.min.z, x1: footprint.max.x, z1: footprint.max.z });
      });
      const wall = (dx: number, dz: number, fallback: number) => {
        down.set(new THREE.Vector3(center.x, floorY + 0.5, center.z), new THREE.Vector3(dx, 0, dz));
        const hit = down.intersectObjects(shells, false)[0];
        return hit ? (dx ? hit.point.x : hit.point.z) - (dx + dz) * 0.03 : fallback;
      };
      area = { x0: wall(-1, 0, bounds.min.x + 0.12), x1: wall(1, 0, bounds.max.x - 0.12), z0: wall(0, -1, bounds.min.z + 0.12), z1: wall(0, 1, bounds.max.z - 0.12) };

      const footprints: THREE.BufferGeometry[] = [];
      for (const name of [...OCCLUDERS, 'home_lab_rack', 'Cube005', 'Cube075', 'Cylinder002', 'Plane007']) {
        const object = model.getObjectByName(name);
        if (!object) continue;
        const box = new THREE.Box3().setFromObject(object);
        const x0 = Math.max(area.x0 - 0.03, box.min.x - 0.12), x1 = Math.min(area.x1 + 0.03, box.max.x + 0.12);
        const z0 = Math.max(area.z0 - 0.03, box.min.z - 0.12), z1 = Math.min(area.z1 + 0.03, box.max.z + 0.12);
        if (x1 > x0 && z1 > z0) footprints.push(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, floorY + 0.004, (z0 + z1) / 2));
      }
      const grounding = footprints.length ? mergeGeometries(footprints) : null;
      footprints.forEach((geometry) => geometry.dispose());
      if (grounding) {
        const contact = new THREE.Mesh(grounding, new THREE.MeshBasicMaterial({ map: blobTexture, transparent: true, opacity: 0.55, depthWrite: false }));
        contact.raycast = () => {};
        world.add(contact);
      }
      const practical = (light: THREE.PointLight, names: string[], pull: number, lift = 0) => {
        const box = new THREE.Box3();
        for (const name of names) {
          const object = model!.getObjectByName(name);
          if (object) box.union(new THREE.Box3().setFromObject(object));
        }
        if (box.isEmpty()) { light.visible = false; return; }
        box.getCenter(light.position).lerp(center, pull).y += lift;
      };
      practical(pendants, ['Sphere006', 'Sphere008', 'Sphere010'], 0.15, -0.25);
      practical(screenGlow, ['Plane002'], 0.22);
      practical(deskGlow, ['lg_screen', 'skydimo_wall_glow'], 0.2);
      practical(deskKey, ['studio_desk'], 0.12, 0.95);

      for (const [name, , , , , parts] of ITEMS) {
        const nodes = (parts ?? []).map((part) => model!.getObjectByName(part)).filter((node): node is THREE.Object3D => !!node);
        if (!nodes.length) continue;
        const group = new THREE.Group();
        group.name = name;
        (nodes[0].parent ?? model).add(group);
        nodes.forEach((node) => group.attach(node));
      }
      if (vinyl) {
        vinyl.scene.name = 'vinyl_set';
        model.add(vinyl.scene);
      }
      const featureTargets: FeatureTarget[] = [], kept = new Set<THREE.Object3D>();
      const ctx: RoomContext = {
        host, stage, screen, scene, world, model: gltf.scene, camera, renderer, base: baseUrl, accent, player,
        works: opts.works ?? [], links: opts.links ?? [], shared, isLight,
        still: () => motion.matches || slow,
        start,
        walkTo: (object) => { const target = targets.find((entry) => entry.object === object); if (target && exploring) walkTo(target); },
        carry: (on) => { carrying = on; start(); return carrier; },
        gesture: (name) => { if (exploring && rig?.trigger(name)) start(); },
        addTarget: (target) => { featureTargets.push(target); },
        keep: (object) => { kept.add(object); },
        showCard: (title, text) => { if (exploring) showNote(title, text); },
        reportVinyl: (state) => opts.onVinyl?.(state),
      };
      features = FEATURES.flatMap((make) => {
        try { return [make(ctx)]; } catch (error) { console.error('Studio feature:', error); return []; }
      });
      model.updateMatrixWorld(true);
      for (const extra of featureTargets) extra.object.userData.roomLabel = extra.label;
      const labelled = ITEMS.map(([name, text]) => {
        const object = model!.getObjectByName(name);
        if (object) object.userData.roomLabel = text;
        return object;
      });

      const replaced = new Set<THREE.Material>();
      const build = (object: THREE.Object3D, name: string, text: string, zone: number, detail: string, kind: Kind) => {
        const target: Target = { object, meshes: [], box: new THREE.Box3(), label: text, detail, kind, rect: { x0: 0, z0: 0, x1: 0, z1: 0 }, zone, deck: kind === 'deck', loose: false, glow: 0, off: false, dirty: false, materials: [] };
        const copies = new Map<string, THREE.Material>();
        const visit = (child: THREE.Object3D) => {
          if (child !== object && child.userData.roomLabel) return;
          child.children.forEach(visit);
          if (!(child instanceof THREE.Mesh)) return;
          const materials = (Array.isArray(child.material) ? child.material : [child.material]).map((material) => {
            if (copies.has(material.uuid)) return copies.get(material.uuid)!;
            const copy = material.clone();
            replaced.add(material);
            copies.set(material.uuid, copy);
            if (copy instanceof THREE.MeshStandardMaterial) {
              const entry = { material: copy, color: copy.emissive.clone() };
              target.materials.push(entry);
            }
            return copy;
          });
          child.material = Array.isArray(child.material) ? materials : materials[0];
        };
        visit(object);
        const spec = SEATS[name];
        const cushion = spec && model!.getObjectByName(spec[0]), rest = spec && model!.getObjectByName(spec[1]);
        if (cushion && rest) {
          const box = new THREE.Box3().setFromObject(cushion), middle = box.getCenter(new THREE.Vector3());
          const back = new THREE.Box3().setFromObject(rest).getCenter(new THREE.Vector3());
          target.seat = { x: middle.x, z: middle.z, y: box.max.y, heading: Math.atan2(middle.x - back.x, middle.z - back.z), activities: spec[2] };
        }
        targets.push(target);
        return target;
      };
      ITEMS.forEach(([name, text, zone, detail, kind], index) => {
        const object = labelled[index];
        if (object) build(object, name, text, zone, detail, kind);
      });
      for (const extra of featureTargets) {
        const target = targets.find((entry) => entry.object === extra.object) ?? build(extra.object, extra.object.name, extra.label, extra.zone ?? -1, extra.detail ?? '', 'gear');
        target.use = extra.use;
        target.hover = extra.hover;
        target.actionText = extra.action;
        target.gesture = extra.gesture;
      }
      chair = targets.find((target) => target.object.name === 'studio_chair' && target.seat);
      tv = targets.find((target) => target.object.name === 'Plane002');
      const keylab = model.getObjectByName('keylab_essential_88_mk3');
      if (keylab) piano = createPiano(keylab, accent, onPiano);
      lid = model.getObjectByName('msi_display_lid');
      if (lid) { lidOpen.copy(lid.quaternion); lidY = lid.position.y; }
      const panel = model.getObjectByName('lg_screen');
      if (panel) screenBox.setFromObject(panel);

      model.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          if (!(material instanceof THREE.MeshStandardMaterial) || material.userData.graded) continue;
          material.userData.graded = true;
          if (material.metalness < 0.5) material.roughness = THREE.MathUtils.clamp(material.roughness, 0.45, 0.95);
          if (material.name === 'Material.030') grade(material, floorTint, floorSat);
          else if (/walnut|oak|Material\.034/i.test(material.name)) grade(material, woodTint, woodSat);
          else if (material.name === 'Material.036') walls.push(material);
          else if (material.name === 'Material.035') material.color.multiplyScalar(0.6);
        }
      });

      const boundaries = new Set<THREE.Object3D>([...targets.map((target) => target.object), ...(piano?.nodes ?? []), ...kept]);
      for (const name of [...ANIMATED, ...OCCLUDERS, 'lg_screen', 'game_room_architecture']) {
        const object = model.getObjectByName(name);
        if (object) boundaries.add(object);
      }
      const discarded = batch(model, boundaries);
      const retained = new Set<THREE.BufferGeometry>();
      const retainedMaterials = new Set<THREE.Material>();
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        retained.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) retainedMaterials.add(material);
      });
      discarded.forEach((geometry) => { if (!retained.has(geometry)) geometry.dispose(); });
      replaced.forEach((material) => { if (!retainedMaterials.has(material)) material.dispose(); });

      for (const name of OCCLUDERS) {
        const object = model.getObjectByName(name);
        if (object && !object.userData.roomLabel) targets.push({ object, meshes: [], box: new THREE.Box3(), label: '', detail: '', kind: 'solid', rect: { x0: 0, z0: 0, x1: 0, z1: 0 }, zone: -1, deck: false, loose: false, glow: 0, off: false, dirty: false, materials: [] });
      }
      model.updateMatrixWorld(true);
      const piece = new THREE.Box3();
      for (const target of targets) {
        const collect = (node: THREE.Object3D) => {
          if (node !== target.object && node.userData.roomLabel) return;
          if (node instanceof THREE.InstancedMesh) {
            node.computeBoundingBox();
            target.meshes.push(node);
            target.box.union(piece.copy(node.boundingBox!).applyMatrix4(node.matrixWorld));
          } else if (node instanceof THREE.Mesh) {
            if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
            target.meshes.push(node);
            target.box.union(piece.copy(node.geometry.boundingBox!).applyMatrix4(node.matrixWorld));
          }
          node.children.forEach(collect);
        };
        collect(target.object);
        target.rect = { x0: target.box.min.x, z0: target.box.min.z, x1: target.box.max.x, z1: target.box.max.z };
        const size = target.box.getSize(new THREE.Vector3());
        target.loose = target.deck || (!!target.label && Math.max(size.x, size.y, size.z) < 0.16);
      }

      const glowing = new Set<THREE.MeshStandardMaterial>();
      model.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          if (material instanceof THREE.MeshStandardMaterial && material.emissive.getHex() !== 0) glowing.add(material);
        }
      });
      glowing.forEach((material) => { material.emissiveIntensity = Math.min(material.emissiveIntensity * 1.4, 2); });
      const tvEntry = tv?.materials.find(({ material }) => material.emissiveMap);
      if (tvEntry) tvScreen = { material: tvEntry.material, map: tvEntry.material.emissiveMap, intensity: tvEntry.material.emissiveIntensity };
      host.dataset.roomTv = 'off';
      targets.map((target, index) => [target.label, index] as const).filter(([text]) => text).sort(([a], [b]) => a.localeCompare(b)).forEach(([text, index]) => goto.add(new Option(text, String(index))));

      grid = new Grid(area, 0.08, RADIUS, rects);
      let spawn: [number, number] | null = null, open = -Infinity;
      for (let i = 0; i < grid.free.length; i++) {
        if (!grid.free[i]) continue;
        const [x, z] = grid.center(i);
        const clearance = rects.reduce((m, r) => Math.min(m, rectDistance(x, z, r)), 0.7);
        const score = clearance - 0.25 * Math.hypot(x - center.x, z - center.z);
        if (score > open) { open = score; spawn = [x, z]; }
      }
      if (spawn) [px, pz] = spawn;
      player.position.set(px, floorY, pz);
      spawned = !!spawn;
      syncEnter();
      features.forEach((feature) => feature.ready?.());
      readAccent();

      loaded = true;
      canvas.style.cursor = 'grab';
      host.dataset.roomState = 'ready';
      status.remove();
      resize();
    })
    .catch((error: Error) => {
      if (disposed || error.name === 'AbortError') return;
      host.dataset.roomState = 'error';
      status.textContent = 'The studio could not load. Music controls below still work.';
      console.error('Studio room:', error);
    });
  resize();

  return {
    deck: () => shared.deck,
    dispose() {
      exitExplore();
      disposed = true;
      abort.abort();
      observer.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      cancelAnimationFrame(frame);
      clearInterval(pollState);
      clearTimeout(tipTimer);
      motion.removeEventListener('change', start);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('lostpointercapture', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerenter', readAccent);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
      STICK_EVENTS.forEach((type) => stickPad.removeEventListener(type, onStick as EventListener));
      stage.removeEventListener('click', onStageClick);
      goto.removeEventListener('change', onGoto);
      stage.removeEventListener('wheel', onWheel);
      enter.removeEventListener('click', enterExplore);
      features.forEach((feature) => feature.dispose?.());
      features = [];
      piano?.dispose();
      movie.dispose();
      release(scene);
      scene.environment?.dispose();
      renderer.dispose();
      canvas.remove(); status.remove(); tip.remove(); enter.remove(); stage.remove();
    },
  };
}
