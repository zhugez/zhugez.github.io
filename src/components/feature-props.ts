import * as THREE from 'three';
import type { FeatureFactory } from './room-feature';

const SPEAKERS: [string, string][] = [['ortizan_c7_left', 'Ortizan C7 · left'], ['ortizan_c7_right', 'Ortizan C7 · right']];
const PLANTS: [string, string, string][] = [
  ['studio_plant', 'Desk plant', 'On the desk'],
  ['Cylinder047', 'Shelf plant', 'On the lower shelf'],
  ['Cylinder050', 'Succulent · left', 'On the TV console'],
  ['Cylinder049', 'Succulent · middle', 'On the TV console'],
  ['Cylinder046', 'Succulent · right', 'On the TV console'],
];
const RACK_DETAIL = 'Home lab servers';
const EFFECT_MS = 1400;
const BLINK_MS = 2400;

type Effect = { object: THREE.Object3D; plant: boolean; start: number; scale: THREE.Vector3; rotation: number };

export const propsFeature: FeatureFactory = (ctx) => {
  const effects = new Map<THREE.Object3D, Effect>();
  const leds: { material: THREE.MeshStandardMaterial; color: THREE.Color }[] = [];
  let rack: THREE.Object3D | undefined;
  let blinkStart = 0;
  let blinking = false;

  const trigger = (object: THREE.Object3D, plant: boolean) => {
    if (ctx.still()) return;
    const running = effects.get(object);
    effects.set(object, { object, plant, start: performance.now(), scale: running?.scale ?? object.scale.clone(), rotation: running?.rotation ?? object.rotation.z });
    ctx.start();
  };

  const restore = ({ object, scale, rotation }: Effect) => {
    object.scale.copy(scale);
    object.rotation.z = rotation;
  };

  const restoreLeds = () => leds.forEach(({ material, color }) => material.emissive.copy(color));

  const find = (name: string) => ctx.model.getObjectByName(name);

  for (const [name, label] of SPEAKERS) {
    const object = find(name);
    if (!object) continue;
    ctx.addTarget({
      object,
      label,
      zone: 2,
      action: () => 'Test the speaker',
      use: () => {
        trigger(object, false);
        return ctx.shared.nowPlaying || 'Nothing playing';
      },
    });
  }

  for (const [name, label, detail] of PLANTS) {
    const object = find(name);
    if (!object) continue;
    ctx.addTarget({
      object,
      label,
      detail,
      action: () => 'Water the plant',
      use: () => {
        trigger(object, true);
        return 'Watered';
      },
    });
  }

  rack = find('home_lab_rack');
  if (rack) {
    ctx.addTarget({
      object: rack,
      label: 'Home lab rack',
      detail: RACK_DETAIL,
      zone: 3,
      action: () => 'Check the servers',
      use: () => {
        if (!ctx.still()) {
          blinkStart = performance.now();
          blinking = true;
          ctx.start();
        }
        return `${RACK_DETAIL} · status lights checked`;
      },
    });
  }

  return {
    ready() {
      const seen = new Set<THREE.Material>();
      rack?.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          if (!(material instanceof THREE.MeshStandardMaterial) || seen.has(material) || material.emissive.getHex() === 0) continue;
          seen.add(material);
          leds.push({ material, color: material.emissive.clone() });
        }
      });
    },
    frame({ now }) {
      let busy = false;
      for (const fx of effects.values()) {
        const t = (now - fx.start) / 1000;
        const decay = Math.exp(-t * 3);
        if (t > EFFECT_MS / 1000) {
          restore(fx);
          effects.delete(fx.object);
          continue;
        }
        if (fx.plant) fx.object.rotation.z = fx.rotation + Math.sin(t * 16) * 0.14 * decay;
        else fx.object.scale.copy(fx.scale).multiplyScalar(1 + Math.sin(t * 42) * 0.03 * decay);
        busy = true;
      }
      if (blinking) {
        if (now - blinkStart < BLINK_MS) {
          leds.forEach(({ material, color }, i) => material.emissive.copy(color).multiplyScalar(Math.sin(now / 70 + i * 2.3) > 0 ? 3 : 0.15));
          busy = true;
        } else {
          blinking = false;
          restoreLeds();
        }
      }
      return busy;
    },
    dispose() {
      effects.forEach(restore);
      effects.clear();
      if (blinking) restoreLeds();
      blinking = false;
    },
  };
};
