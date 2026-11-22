import * as THREE from 'three';
import { Keybed } from './piano/keybed';
import { computerKey, shiftOctave } from './piano/input';
import { PianoSynth } from './piano/synth';

type Key = { node: THREE.Object3D; rest: THREE.Vector3; travel: THREE.Vector3; depth: number; goal: number; parts: { mesh: THREE.Mesh; material: THREE.Material | THREE.Material[] }[] };

const TRAVEL = 0.006;

export function createPiano(root: THREE.Object3D, tint: THREE.Color, onChange: () => void) {
  const keys = new Map<number, Key>();
  const meshes: THREE.Mesh[] = [];
  const moving = new Set<Key>();
  const typed = new Map<string, number>();
  const synth = new PianoSynth();
  const lit = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  const litMaterial = (material: THREE.Material) => {
    if (!(material instanceof THREE.MeshStandardMaterial)) return material;
    const copy = lit.get(material) ?? material.clone();
    lit.set(material, copy);
    copy.color.copy(material.color).lerp(tint, 0.6);
    copy.emissive.copy(tint).multiplyScalar(0.7);
    return copy;
  };
  let base = 60;
  const still = new THREE.Group();
  root.add(still);
  root.updateMatrixWorld(true);
  const found: THREE.Object3D[] = [];
  root.traverse((node) => { if (Number.isInteger(node.userData.midi_note) && node.parent) found.push(node); });
  for (const node of found) {
    const midi = node.userData.midi_note;
    const copy = node.clone();
    copy.traverse((part) => { part.userData = {}; });
    node.parent!.add(copy);
    still.attach(copy);
    node.visible = false;
    const world = node.getWorldPosition(new THREE.Vector3());
    const origin = node.parent.worldToLocal(world.clone());
    const travel = node.parent.worldToLocal(world.clone().setY(world.y - TRAVEL)).sub(origin);
    const key: Key = { node, rest: node.position.clone(), travel, depth: 0, goal: 0, parts: [] };
    keys.set(midi, key);
    node.traverse((part) => {
      if (!(part instanceof THREE.Mesh)) return;
      part.userData.midi = midi;
      meshes.push(part);
      key.parts.push({ mesh: part, material: part.material });
    });
  }
  const tray = root.parent?.name === 'midi_tray' ? root.parent : undefined;
  const out = tray?.position.clone() ?? new THREE.Vector3();
  const travel = Number(tray?.userData.fully_extended_z_m) - Number(tray?.userData.retracted_z_m);
  const stowed = out.clone().setZ(out.z - (Number.isFinite(travel) ? travel : 0));
  let slid = 0, slideGoal = 0;
  tray?.position.copy(stowed);
  const keybed = new Keybed({
    attack: (midi, velocity) => synth.attack(midi, velocity),
    release: (midi) => synth.release(midi),
    visual: (midi, down) => {
      const key = keys.get(midi);
      if (!key) return;
      key.goal = down ? 1 : 0;
      for (const { mesh, material } of key.parts) mesh.material = down ? (Array.isArray(material) ? material.map(litMaterial) : litMaterial(material)) : material;
      moving.add(key);
      onChange();
    },
  });

  function octave(delta: number) {
    base = shiftOctave(base, delta);
    onChange();
  }

  function releaseAll() {
    typed.clear();
    keybed.releaseAll();
    synth.releaseAll();
    onChange();
  }

  return {
    nodes: [still, ...found],
    show(playing: boolean) {
      slideGoal = playing ? 1 : 0;
      still.visible = !playing;
      found.forEach((node) => { node.visible = playing; });
    },
    meshes,
    bounds() {
      const box = new THREE.Box3();
      meshes.forEach((mesh) => box.expandByObject(mesh));
      if (tray?.parent) box.translate(tray.parent.localToWorld(out.clone()).sub(tray.getWorldPosition(new THREE.Vector3())));
      return box;
    },
    get base() { return base; },
    get pedal() { return keybed.pedal; },
    get voices() { return synth.active; },
    down() {
      return [...keys].filter(([, key]) => key.depth > 0.5).map(([midi]) => midi);
    },
    pick(ray: THREE.Raycaster): number | null {
      return ray.intersectObjects(meshes, false)[0]?.object.userData.midi ?? null;
    },
    octave,
    sustain(down: boolean) {
      keybed.setPedal(down);
      onChange();
    },
    key(event: KeyboardEvent) {
      const down = event.type === 'keydown';
      if (event.code === 'Space') {
        if (!event.repeat) keybed.setPedal(down);
        onChange();
        return true;
      }
      if (event.code === 'KeyZ' || event.code === 'KeyX') {
        if (down && !event.repeat) octave(event.code === 'KeyX' ? 1 : -1);
        return true;
      }
      if (down) {
        const midi = computerKey(event.code, base);
        if (midi === null) return false;
        if (!event.repeat && !typed.has(event.code)) {
          typed.set(event.code, midi);
          keybed.press('kb', midi, 0.8);
        }
        return true;
      }
      const midi = typed.get(event.code);
      if (midi === undefined) return false;
      typed.delete(event.code);
      if (![...typed.values()].includes(midi)) keybed.release('kb', midi);
      return true;
    },
    touch(pointer: number, midi: number | null, velocity = 0.8) {
      if (midi === null) keybed.releaseSource(`p${pointer}`);
      else keybed.slide(`p${pointer}`, midi, velocity);
    },
    lift(pointer: number) {
      keybed.releaseSource(`p${pointer}`);
    },
    releaseAll,
    get extended() { return !tray || slid === 1; },
    update(dt: number, animate: boolean, slide = animate) {
      for (const key of moving) {
        const rate = key.goal > key.depth ? 45 : 22;
        key.depth = animate ? key.depth + (key.goal - key.depth) * Math.min(1, dt * rate) : key.goal;
        if (Math.abs(key.goal - key.depth) < 0.01) key.depth = key.goal;
        key.node.position.copy(key.rest).addScaledVector(key.travel, key.depth);
        if (key.depth === key.goal) moving.delete(key);
      }
      if (tray && slid !== slideGoal) {
        slid = slide && Math.abs(slideGoal - slid) > dt * 1.25 ? slid + Math.sign(slideGoal - slid) * dt * 1.25 : slideGoal;
        tray.position.lerpVectors(stowed, out, slid * slid * (3 - 2 * slid));
      }
      return moving.size > 0 || slid !== slideGoal;
    },
    dispose() {
      releaseAll();
      for (const key of keys.values()) key.node.position.copy(key.rest);
      tray?.position.copy(out);
      lit.forEach((material) => material.dispose());
      synth.dispose();
    },
  };
}

export type Piano = ReturnType<typeof createPiano>;
