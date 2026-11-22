import * as THREE from 'three';
import type { Joints, Pivot } from './room-character';

const BONES = {
  body: 'Spine', head: 'Head', leg_l: 'ThighL', leg_r: 'ThighR', knee_l: 'ShinL', knee_r: 'ShinR',
  arm_l: 'UpperArmL', arm_r: 'UpperArmR', elbow_l: 'ForearmL', elbow_r: 'ForearmR',
} as const;
const UPPER = /^(Spine|Chest|Neck|Head|Clavicle|UpperArm|Forearm|Hand|Index|Middle|Ring|Pinky|Thumb|LaptopSocket|Laptop)/;
const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
const FADE = 10;

type Laptop = 'none' | 'pick' | 'carry' | 'put';

export function rigSkinned(scene: THREE.Object3D, clips: THREE.AnimationClip[]) {
  const mixer = new THREE.AnimationMixer(scene);
  const clip = (name: string) => clips.find((entry) => entry.name === name);
  const part = (source: THREE.AnimationClip | undefined, upper: boolean) => source && new THREE.AnimationClip(
    `${source.name}${upper ? 'Up' : 'Low'}`, source.duration,
    source.tracks.filter((track) => UPPER.test(track.name.split('.')[0]) === upper),
  );
  const sources: Record<string, THREE.AnimationClip | undefined> = {
    idle: clip('Idle'), walk: clip('Walk'), run: clip('Run'), pick: clip('PickUpLaptop'), put: clip('PutDownLaptop'),
    carryUp: part(clip('CarryLaptop'), true),
  };
  for (const name of ['idle', 'walk', 'run']) sources[`${name}Low`] = part(sources[name], false);
  const actions = new Map<string, THREE.AnimationAction>();
  for (const [name, source] of Object.entries(sources)) {
    if (!source) continue;
    const action = mixer.clipAction(source);
    if (name === 'pick' || name === 'put') { action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; }
    action.setEffectiveWeight(name === 'idle' ? 1 : 0).play();
    actions.set(name, action);
  }

  const bone = (name: string) => scene.getObjectByName(name);
  const hips = bone('Hips');
  const laptop = bone('Laptop');
  const contact = Number(laptop?.userData.pickupContactNormalized ?? 0.52);
  const pivots: Record<string, Pivot> = {};
  const bound = Object.entries(BONES).map(([key, name]) => {
    pivots[key] = { rotation: { x: 0, y: 0, z: 0 }, position: { y: 0 } };
    return [pivots[key], bone(name)] as const;
  }).filter((entry): entry is readonly [Pivot, THREE.Object3D] => !!entry[1]);

  const carrier = new THREE.Group();
  carrier.position.y = 0.9;
  scene.add(carrier);

  let mode: Laptop = 'none', onContact: (() => void) | null = null;
  const qs = new THREE.Quaternion(), qp = new THREE.Quaternion(), qr = new THREE.Quaternion(), axis = new THREE.Vector3();
  const turn = (target: THREE.Object3D, index: number, angle: number) => {
    if (!angle || !target.parent) return;
    target.parent.updateWorldMatrix(true, false);
    scene.getWorldQuaternion(qr);
    target.parent.getWorldQuaternion(qp);
    axis.copy(AXES[index]).applyQuaternion(qr).applyQuaternion(qp.invert());
    target.quaternion.premultiply(qs.setFromAxisAngle(axis, angle));
  };
  const finishLaptop = () => {
    onContact?.();
    onContact = null;
    mode = mode === 'pick' ? 'carry' : mode === 'put' ? 'none' : mode;
  };

  function update(dt: number, moving: boolean, running: boolean) {
    const oneShot = mode === 'pick' || mode === 'put' ? actions.get(mode) : undefined;
    if (oneShot && moving) finishLaptop();
    const loco = moving ? (running ? 'run' : 'walk') : 'idle';
    const goal = new Map<string, number>();
    if (mode === 'pick' || mode === 'put') goal.set(mode, 1);
    else if (mode === 'carry') { goal.set(`${loco}Low`, 1); goal.set('carryUp', 1); }
    else goal.set(loco, 1);
    const ease = 1 - Math.exp(-dt * FADE);
    for (const [name, action] of actions) {
      const weight = action.getEffectiveWeight();
      const next = weight + ((goal.get(name) ?? 0) - weight) * ease;
      action.setEffectiveWeight(Math.abs(next - (goal.get(name) ?? 0)) < 0.002 ? goal.get(name) ?? 0 : next);
    }
    for (const name of ['idle', 'walk', 'run']) {
      const full = actions.get(name), low = actions.get(`${name}Low`);
      if (full && low) low.time = full.time;
    }
    mixer.update(dt);

    const shot = mode === 'pick' || mode === 'put' ? actions.get(mode) : undefined;
    const phase = shot ? shot.time / shot.getClip().duration : 0;
    if (shot && onContact && phase >= contact) { onContact(); onContact = null; }
    if (shot && phase >= 1) finishLaptop();
    if (laptop) laptop.visible = mode === 'carry' || (mode === 'pick' && phase >= contact) || (mode === 'put' && phase < contact);

    if (hips) hips.position.y += pivots.body.position.y;
    for (const [pivot, target] of bound) {
      turn(target, 2, pivot.rotation.z);
      turn(target, 1, pivot.rotation.y);
      turn(target, 0, pivot.rotation.x);
    }
  }

  update(0, false, false);
  return {
    joints: pivots as Joints,
    carrier,
    get busy() { return mode === 'pick' || mode === 'put'; },
    laptop(carry: boolean, contactNow: () => void) {
      if (carry === (mode === 'carry' || mode === 'pick')) return;
      onContact?.();
      mode = carry ? 'pick' : 'put';
      onContact = contactNow;
      const action = actions.get(mode);
      if (!action) { finishLaptop(); return; }
      action.reset().play();
    },
    drop() {
      onContact = null;
      mode = 'none';
      actions.get('pick')?.stop();
      actions.get('put')?.stop();
    },
    update,
  };
}

export type SkinnedRig = ReturnType<typeof rigSkinned>;
