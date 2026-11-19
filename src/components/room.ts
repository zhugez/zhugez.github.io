import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type Opts = {
  get: () => { playing: boolean; active: number; note: string };
  onToggle: () => void;
  onHover: (zone: number) => void;
  art?: string;
  gear?: string[];
};

type Target = {
  object: THREE.Object3D;
  meshes: THREE.Mesh[];
  box: THREE.Box3;
  label: string;
  zone: number;
  deck: boolean;
  loose: boolean;
  glow: number;
  materials: { material: THREE.MeshStandardMaterial; color: THREE.Color }[];
};

const ITEMS: [string, string, number][] = [
  ['lg_24gs60f_b', 'LG 24GS60F-B', 0],
  ['obsbot_meet_2', 'OBSBOT Meet 2', 0],
  ['xppen_deco_01_v3', 'XPPen Deco 01 V3', 0],
  ['hyperwork_t6_pro_2025', 'HyperWork T6 Pro 2025', 0],
  ['atk_ace68_air', 'ATK ACE68 Air', 1],
  ['atk_x1_ultimate', 'ATK Blazing Sky X1 Ultimate', 1],
  ['nj81', 'NJ81', 1],
  ['secondary_laptop', 'MSI Modern 14', 1],
  ['asus_nuc_15_pro_plus', 'ASUS NUC 15 Pro+', 1],
  ['keylab_essential_88_mk3', 'Arturia KeyLab Essential 88 mk3', 2],
  ['ortizan_c7_left', 'Ortizan C7 · left', 2],
  ['ortizan_c7_right', 'Ortizan C7 · right', 2],
  ['arturia_minifuse_2', 'Arturia MiniFuse 2', 2],
  ['epz_tp35_pro', 'EPZ TP35 PRO', 2],
  ['ath_m50x', 'Audio-Technica ATH-M50x', 2],
  ['razer_seiren_v3_chroma', 'Razer Seiren V3 Chroma', 2],
  ['turntable', 'Audio-Technica AT-LPA2', 2],
  ['home_lab_rack', 'Home lab rack', 3],
];
const OCCLUDERS = ['studio_chair', 'studio_desk', 'secondary_workstation', 'record_cabinet'];
const ANIMATED = ['vinyl_record', 'platter', 'tonearm', 'c7_woofer_left', 'c7_woofer_right'];
const OFFSET = new THREE.Vector3(-7.5, 6.5, 8);
const UP = new THREE.Vector3(0, 1, 0);
const YAW = 0.45;
const ARM = -22 * Math.PI / 180;

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
  renderer.toneMappingExposure = 1.12;
  host.appendChild(canvas);
  host.dataset.roomState = 'loading';

  const status = document.createElement('div');
  status.className = 'room-load';
  status.setAttribute('role', 'status');
  status.textContent = 'Loading your studio…';
  const tip = document.createElement('div');
  tip.className = 'room-tip';
  tip.setAttribute('aria-hidden', 'true');
  host.append(status, tip);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  scene.environment = pmrem.fromScene(roomEnvironment, 0.04).texture;
  scene.environmentIntensity = 0.18;
  roomEnvironment.dispose();
  pmrem.dispose();
  const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.01, 100);
  const world = new THREE.Group();
  scene.add(world);
  scene.add(new THREE.HemisphereLight(0xc8d0ff, 0x2a2433, 0.6));
  const key = new THREE.DirectionalLight(0xffeedd, 3);
  key.position.set(-5, 6, 2.5);
  scene.add(key);
  const lamp = new THREE.PointLight(0xffc98a, 0, 2.6, 2);
  scene.add(lamp);

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
  let record: THREE.Object3D | undefined, platter: THREE.Object3D | undefined, arm: THREE.Object3D | undefined;
  let armRest = 0, armAngle = 0;
  let cones: THREE.Object3D[] = [];
  let coneScales: THREE.Vector3[] = [];

  const noteCanvas = document.createElement('canvas');
  noteCanvas.width = 128;
  noteCanvas.height = 64;
  const noteContext = noteCanvas.getContext('2d')!;
  const noteTexture = new THREE.CanvasTexture(noteCanvas);
  noteTexture.colorSpace = THREE.SRGBColorSpace;
  const noteMaterial = new THREE.SpriteMaterial({ map: noteTexture, depthWrite: false, transparent: true });
  const noteSprite = new THREE.Sprite(noteMaterial);
  noteSprite.scale.set(0.32, 0.16, 1);
  noteSprite.visible = false;
  noteSprite.raycast = () => {};
  world.add(noteSprite);
  const noteOrigin = new THREE.Vector3();
  let noteSince = 0;

  function readAccent() {
    noteContext.fillStyle = '#7d97ec';
    noteContext.fillStyle = getComputedStyle(host).getPropertyValue('--accent').trim() || '#7d97ec';
    accent.set(noteContext.fillStyle as string);
  }

  function aim(angle: number) {
    camera.position.copy(OFFSET).applyAxisAngle(UP, angle).add(look);
    camera.lookAt(look);
    camera.updateMatrixWorld();
  }

  function place() {
    aim(yaw);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }

  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, slow ? 1 : 1.5));
    renderer.setSize(width, height, false);
    if (loaded) {
      const saved = look.clone();
      look.copy(center);
      let x = 0, y = 0;
      for (const angle of [-YAW, 0, YAW]) {
        aim(angle);
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
      place();
    }
    start();
  }

  function schedule() {
    if (!frame && visible && !document.hidden && !disposed && loaded) frame = requestAnimationFrame(render);
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
    return target.deck ? (opts.get().playing ? 'Record player · pause' : 'Record player · play Soft Static') : target.label;
  }

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

  function focus(target: Target | null) {
    focused = target;
    if (target) {
      const size = target.box.getSize(new THREE.Vector3());
      target.box.getCenter(lookGoal);
      zoomGoal = THREE.MathUtils.clamp(camera.top / (Math.max(size.x, size.y, size.z) * 1.5), 1.25, 3);
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
    if (!visible || document.hidden || disposed || !loaded) return;
    const cap = dragging ? 0 : slow ? 100 : 33;
    if (now - drawn < cap) { schedule(); return; }
    const dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 0;
    lastTime = now;
    const { playing, active, note } = opts.get();
    const animate = !motion.matches && !slow;
    const ease = animate ? 1 - Math.exp(-dt * 10) : 1;
    let busy = false;

    yaw += (yawGoal - yaw) * ease;
    zoom += (zoomGoal - zoom) * ease;
    look.lerp(lookGoal, ease);
    if (Math.abs(yawGoal - yaw) > 1e-4 || Math.abs(zoomGoal - zoom) > 1e-4 || look.distanceToSquared(lookGoal) > 1e-8) busy = true;
    else { yaw = yawGoal; zoom = zoomGoal; look.copy(lookGoal); }
    place();

    if (hoverAt && !dragging) {
      setHover(pickAt(hoverAt.x, hoverAt.y), hoverAt.x, hoverAt.y);
      hoverAt = null;
    }

    for (const target of targets) {
      const goal = target === hovered || target === focused ? 1 : target.zone === active ? 0.3 : 0;
      if (Math.abs(goal - target.glow) < 0.004) {
        if (target.glow === goal) continue;
        target.glow = goal;
      } else {
        target.glow += (goal - target.glow) * (animate ? 1 - Math.exp(-dt * 14) : 1);
        busy = true;
      }
      for (const { material, color } of target.materials) material.emissive.copy(tint.copy(accent).multiplyScalar(target.glow * 0.32)).add(color);
    }

    const continuous = playing && animate;
    if (continuous) {
      if (record) record.rotation.y -= dt * 3.49;
      if (platter) platter.rotation.y -= dt * 3.49;
      busy = true;
    }
    const armGoal = playing ? ARM : 0;
    armAngle = animate ? THREE.MathUtils.lerp(armAngle, armGoal, 1 - Math.exp(-dt * 8)) : armGoal;
    if (Math.abs(armAngle - armGoal) > 0.002) busy = true;
    if (arm) arm.rotation.y = armRest + armAngle;
    cones.forEach((cone, i) => cone.scale.copy(coneScales[i]).multiplyScalar(continuous ? 1 + Math.sin(now / 85) * 0.035 : 1));
    if (note !== lastNote || playing !== lastPlaying) {
      noteContext.clearRect(0, 0, 128, 64);
      noteContext.fillStyle = '#e3e6ff';
      noteContext.font = '600 32px monospace';
      noteContext.textAlign = 'center';
      noteContext.fillText(note.toUpperCase(), 64, 44);
      noteTexture.needsUpdate = true;
      noteSince = now;
    }
    const age = (now - noteSince) / 1000;
    noteSprite.visible = continuous && !!note && age < 0.8;
    noteSprite.position.copy(noteOrigin);
    noteSprite.position.y += 0.12 + age * 0.2;
    noteMaterial.opacity = Math.max(0, 1 - age / 0.8);
    if (hovered?.deck && playing !== lastPlaying) tip.textContent = label(hovered);

    renderer.render(scene, camera);
    drawn = now;
    lastPlaying = playing;
    lastActive = active;
    lastNote = note;
    host.dataset.roomDrawCalls = String(renderer.info.render.calls);
    host.dataset.roomTriangles = String(renderer.info.render.triangles);
    if (continuous && probeStart >= 0) {
      if (!probeStart) probeStart = now + 800;
      else if (now > probeStart) {
        probeFrames++;
        if (now - probeStart >= 1200) {
          if (probeFrames / ((now - probeStart) / 1000) < 15) {
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
    const state = opts.get();
    if (state.playing !== lastPlaying || state.active !== lastActive || (state.playing && state.note !== lastNote)) start();
  }, 100);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    lastTime = 0;
    if (probeStart > 0) { probeStart = 0; probeFrames = 0; }
    if (visible) start();
    else { cancelAnimationFrame(frame); frame = 0; }
  });
  intersection.observe(host);
  const onVisibility = () => {
    lastTime = 0;
    if (probeStart > 0) { probeStart = 0; probeFrames = 0; }
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else start();
  };
  document.addEventListener('visibilitychange', onVisibility);
  motion.addEventListener('change', start);

  const endPress = (event: PointerEvent, cancelled: boolean) => {
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
  const onDown = (event: PointerEvent) => {
    if (!loaded || event.button !== 0 || press) return;
    suppressClick = false;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: yawGoal };
  };
  const onMove = (event: PointerEvent) => {
    if (!loaded) return;
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
    place();
    const target = pickAt(event.clientX, event.clientY);
    if (target?.deck) opts.onToggle();
    else focus(target && target !== focused ? target : null);
    const touch = (event as PointerEvent).pointerType === 'touch';
    if (touch || target?.deck) {
      showTip(target?.deck ? label(target) : target?.label ?? '', event.clientX, event.clientY);
      clearTimeout(tipTimer);
      if (touch) tipTimer = window.setTimeout(() => tip.classList.remove('on'), 1800);
    }
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && focused) focus(null);
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
    .then((data) => loader.parseAsync(data, new URL('.', modelUrl).href))
    .then((gltf) => {
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

      const replaced = new Set<THREE.Material>();
      for (const [name, text, zone] of ITEMS) {
        const object = model.getObjectByName(name);
        if (!object) continue;
        object.userData.roomLabel = text;
        const target: Target = { object, meshes: [], box: new THREE.Box3(), label: text, zone, deck: name === 'turntable', loose: false, glow: 0, materials: [] };
        const copies = new Map<string, THREE.Material>();
        object.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          const materials = (Array.isArray(child.material) ? child.material : [child.material]).map((material) => {
            if (copies.has(material.uuid)) return copies.get(material.uuid)!;
            const copy = material.clone();
            replaced.add(material);
            copies.set(material.uuid, copy);
            if (copy instanceof THREE.MeshStandardMaterial) target.materials.push({ material: copy, color: copy.emissive.clone() });
            return copy;
          });
          child.material = Array.isArray(child.material) ? materials : materials[0];
        });
        targets.push(target);
      }

      const boundaries = new Set<THREE.Object3D>(targets.map((target) => target.object));
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
        if (object) targets.push({ object, meshes: [], box: new THREE.Box3(), label: '', zone: -1, deck: false, loose: false, glow: 0, materials: [] });
      }
      model.updateMatrixWorld(true);
      const piece = new THREE.Box3();
      for (const target of targets) {
        const collect = (node: THREE.Object3D) => {
          if (node !== target.object && node.userData.roomLabel) return;
          if (node instanceof THREE.Mesh) {
            if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
            target.meshes.push(node);
            target.box.union(piece.copy(node.geometry.boundingBox!).applyMatrix4(node.matrixWorld));
          }
          node.children.forEach(collect);
        };
        collect(target.object);
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
      glowing.forEach((material) => { material.emissiveIntensity *= 1.6; });

      const desklamp = model.getObjectByName('desk_lamp');
      if (desklamp) {
        new THREE.Box3().setFromObject(desklamp).getCenter(lamp.position);
        lamp.position.y += 0.05;
        lamp.intensity = 2.5;
      }
      readAccent();

      record = model.getObjectByName('vinyl_record');
      platter = model.getObjectByName('platter');
      arm = model.getObjectByName('tonearm');
      armRest = arm?.rotation.y ?? 0;
      record?.getWorldPosition(noteOrigin);
      cones = ['c7_woofer_left', 'c7_woofer_right'].map((name) => model!.getObjectByName(name)).filter((node): node is THREE.Object3D => !!node);
      coneScales = cones.map((cone) => cone.scale.clone());
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
    dispose() {
      disposed = true;
      abort.abort();
      observer.disconnect();
      intersection.disconnect();
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
      release(scene);
      scene.environment?.dispose();
      renderer.dispose();
      canvas.remove(); status.remove(); tip.remove();
    },
  };
}
