import * as THREE from 'three';
import type { FeatureFactory } from './room-feature';
import { createHexWord } from './room-hexword';
import { SKYDIMO_ZONES, edgeSamples, ledBusy, ledColor, nextMode, zoneU, type LedState } from './room-lights';

export const WORD = { y: 1.66, z: 0.4, height: 0.4 };
const WORD_Y = WORD.y;
const WORD_Z = WORD.z;

export const ledsyncFeature: FeatureFactory = (ctx) => {
  const { model } = ctx;
  model.getObjectByName('Plane018')?.removeFromParent();
  model.updateMatrixWorld(true);

  const center = new THREE.Vector3(2.81, WORD_Y, WORD_Z);
  const hit = new THREE.Raycaster(new THREE.Vector3(2, WORD_Y, WORD_Z), new THREE.Vector3(1, 0, 0), 0, 3)
    .intersectObject(model, true)
    .find((entry) => entry.object instanceof THREE.Mesh);
  if (hit) center.x = hit.point.x;
  center.x -= 0.005;

  const word = createHexWord({ center, normal: new THREE.Vector3(-1, 0, 0), maxWidth: 2.2, maxHeight: WORD.height });
  model.add(word.mesh, word.light);

  const label = { sync: 'Sync', static: 'Static', off: 'Off' } as const;
  const cycle = () => {
    ctx.shared.ledMode = nextMode(ctx.shared.ledMode);
    ctx.start();
    return `LEDs ${label[ctx.shared.ledMode]}`;
  };
  ctx.addTarget({ object: word.mesh, label: 'ZhugeZ', detail: 'Hex light wall', hover: () => `ZhugeZ · LEDs ${label[ctx.shared.ledMode]}`, use: cycle });

  const strip = model.getObjectByName('skydimo_monitor_backlight');
  const glowNode = model.getObjectByName('skydimo_wall_glow');
  if (strip) ctx.keep(strip);
  if (glowNode) ctx.keep(glowNode);

  const zoneNames = Array.from({ length: SKYDIMO_ZONES }, (_, i) => `skydimo_led_zone_${String(i + 1).padStart(2, '0')}`);
  const zonePositions = zoneNames.map((name) => model.getObjectByName(name)?.getWorldPosition(new THREE.Vector3()));
  const mid = new THREE.Vector3();
  zonePositions.forEach((p) => p && mid.add(p));
  mid.divideScalar(Math.max(1, zonePositions.filter(Boolean).length));
  const pathKey = (p: THREE.Vector3) => {
    const a = Math.atan2(-(p.z - mid.z), -(p.y - mid.y));
    return a < 0 ? a + 2 * Math.PI : a;
  };
  const pathOrder = zoneNames
    .map((name, i) => ({ name, position: zonePositions[i] }))
    .filter((zone): zone is { name: string; position: THREE.Vector3 } => !!zone.position)
    .sort((a, b) => pathKey(a.position) - pathKey(b.position))
    .map((zone) => zone.name);

  let zones: THREE.MeshStandardMaterial[] = [];
  let wallGlow: THREE.MeshStandardMaterial | null = null;
  let wallGlowMesh: THREE.Mesh | null = null;
  let noteName = '';
  let noteIndex = -1;
  let noteAt = 0;
  let ambient: [number, number, number][] | undefined;
  let sampled = false;
  const tileRgb = new Float32Array(word.u.length * 3);
  const rgb: [number, number, number] = [0, 0, 0];
  const mean = new THREE.Color();

  const sampleScreen = () => {
    const screen = model.getObjectByName('lg_screen');
    const material = screen instanceof THREE.Mesh ? screen.material : null;
    const image = material instanceof THREE.MeshStandardMaterial ? (material.map?.image as unknown) : null;
    if (!(image instanceof HTMLCanvasElement) || !image.width || !image.height) return undefined;
    const small = document.createElement('canvas');
    small.width = 64;
    small.height = Math.max(1, Math.round((64 * image.height) / image.width));
    const context = small.getContext('2d', { willReadFrequently: true });
    if (!context) return undefined;
    context.drawImage(image, 0, 0, small.width, small.height);
    return edgeSamples(context.getImageData(0, 0, small.width, small.height).data, small.width, small.height, SKYDIMO_ZONES);
  };

  return {
    ready() {
      zones = pathOrder.flatMap((name) => {
        const node = model.getObjectByName(name);
        return node instanceof THREE.Mesh && node.material instanceof THREE.MeshStandardMaterial ? [node.material] : [];
      });
      const glow = model.getObjectByName('skydimo_wall_glow');
      if (glow instanceof THREE.Mesh && glow.material instanceof THREE.MeshStandardMaterial) {
        wallGlowMesh = glow;
        wallGlow = glow.material;
      }
    },
    frame(info) {
      const lyric = ctx.shared.lyric;
      if (lyric && lyric !== noteName) {
        noteIndex++;
        noteAt = info.now / 1000;
      }
      noteName = lyric;
      if (info.activity === 'computer') {
        if (!sampled) {
          ambient = sampleScreen();
          sampled = true;
        }
      } else {
        ambient = undefined;
        sampled = false;
      }
      const state: LedState = {
        time: info.now / 1000,
        playing: info.playing,
        note: noteIndex,
        noteAt,
        hue: ctx.accent.getHSL({ h: 0, s: 0, l: 0 }, THREE.SRGBColorSpace).h * 360,
        light: ctx.isLight(),
        mode: ctx.shared.ledMode,
        still: ctx.still(),
        ambient,
      };
      for (let i = 0; i < word.u.length; i++) {
        ledColor(word.u[i], state, rgb);
        tileRgb[i * 3] = rgb[0];
        tileRgb[i * 3 + 1] = rgb[1];
        tileRgb[i * 3 + 2] = rgb[2];
      }
      word.setColors(tileRgb);
      mean.setRGB(0, 0, 0);
      zones.forEach((material, i) => {
        ledColor(zoneU(i), state, rgb);
        material.emissive.setRGB(rgb[0], rgb[1], rgb[2]);
        material.emissiveIntensity = 1.6;
        material.color.setRGB(rgb[0] * 0.4, rgb[1] * 0.4, rgb[2] * 0.4);
        mean.r += rgb[0];
        mean.g += rgb[1];
        mean.b += rgb[2];
      });
      if (zones.length) mean.multiplyScalar(1 / zones.length);
      if (wallGlow && wallGlowMesh) {
        wallGlow.emissive.copy(mean);
        wallGlow.color.copy(mean);
        wallGlowMesh.visible = state.mode !== 'off';
      }
      word.light.color.copy(mean);
      word.light.intensity = state.mode === 'off' ? 0 : 0.8;
      return ledBusy(state) && (info.playing || info.activity === 'computer');
    },
    theme() {
      ctx.start();
    },
    activity() {
      ctx.start();
    },
    dispose() {
      word.dispose();
    },
  };
};
