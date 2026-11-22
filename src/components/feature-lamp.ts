import * as THREE from 'three';
import type { FeatureFactory } from './room-feature';

const INTENSITY = 2.5;

export const lampFeature: FeatureFactory = (ctx) => {
  const lamp = ctx.model.getObjectByName('desk_lamp');
  const light = new THREE.PointLight(0xffc98a, INTENSITY, 2.6, 2);
  const bulbs: { material: THREE.MeshStandardMaterial; intensity: number }[] = [];
  let on = true;
  ctx.scene.add(light);

  const apply = () => {
    for (const bulb of bulbs) bulb.material.emissiveIntensity = on ? bulb.intensity : 0;
    if (ctx.still()) light.intensity = on ? INTENSITY : 0;
    ctx.start();
  };

  if (lamp) {
    ctx.addTarget({
      object: lamp,
      label: 'Desk lamp',
      detail: 'Warm task light',
      zone: 1,
      hover: () => on ? 'Desk lamp · turn off' : 'Desk lamp · turn on',
      action: () => on ? 'Turn the lamp off' : 'Turn the lamp on',
      use: () => {
        on = !on;
        apply();
        return on ? 'Lamp on' : 'Lamp off';
      },
    });
  }

  return {
    ready() {
      if (!lamp) return;
      new THREE.Box3().setFromObject(lamp).getCenter(light.position);
      light.position.y += 0.05;
      const seen = new Set<THREE.Material>();
      lamp.traverse((node) => {
        if (!(node instanceof THREE.Mesh) || !/bulb/.test(node.name)) return;
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          if (!(material instanceof THREE.MeshStandardMaterial) || seen.has(material)) continue;
          seen.add(material);
          bulbs.push({ material, intensity: material.emissiveIntensity });
        }
      });
      apply();
    },
    frame({ dt, animate }) {
      const goal = on ? INTENSITY : 0;
      if (!animate) {
        light.intensity = goal;
        return false;
      }
      light.intensity += (goal - light.intensity) * (1 - Math.exp(-dt * 10));
      if (Math.abs(light.intensity - goal) > 0.01) return true;
      light.intensity = goal;
      return false;
    },
    dispose() {
      for (const bulb of bulbs) bulb.material.emissiveIntensity = bulb.intensity;
      light.removeFromParent();
      light.dispose();
    },
  };
};
