import * as THREE from 'three';
import type { FeatureFactory } from './room-feature';
import { desktopTexture, mountDesktop } from './room-desktop';

export const desktopFeature: FeatureFactory = (ctx) => {
  let panel: THREE.Mesh | undefined, original: THREE.Material | THREE.Material[] | undefined;
  let material: THREE.MeshStandardMaterial | undefined, texture: THREE.CanvasTexture | undefined;
  let desktop: ReturnType<typeof mountDesktop> | undefined;
  const brighten = () => { if (material) material.emissiveIntensity = ctx.isLight() ? 0.8 : 0.9; };

  return {
    ready() {
      const node = ctx.model.getObjectByName('lg_screen');
      if (!(node instanceof THREE.Mesh) || Array.isArray(node.material) || !(node.material instanceof THREE.MeshStandardMaterial)) return;
      panel = node;
      original = node.material;
      texture = desktopTexture(ctx.base, ctx.start);
      texture.flipY = false;
      material = node.material.clone();
      material.map = texture;
      material.emissiveMap = texture;
      material.emissive.set(0xffffff);
      brighten();
      node.material = material;
      ctx.start();
    },
    theme: brighten,
    activity(name) {
      if (name !== 'computer' || desktop) return;
      desktop = mountDesktop(ctx.screen, {
        works: ctx.works,
        links: ctx.links,
        base: ctx.base,
        ledMode: () => ctx.shared.ledMode,
        setLedMode: (mode) => { ctx.shared.ledMode = mode; ctx.start(); },
      });
    },
    dispose() {
      if (panel && original) panel.material = original;
      material?.dispose();
      texture?.dispose();
      desktop?.dispose();
    },
  };
};
