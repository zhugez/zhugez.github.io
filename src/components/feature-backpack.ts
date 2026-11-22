import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { FeatureFactory } from './room-feature';

const SIZE = new THREE.Vector3(0.29, 0.42, 0.15);
const LEAN = 0.32;

export const backpackFeature: FeatureFactory = (ctx) => {
  const cushion = ctx.model.getObjectByName('Cube076');
  const back = ctx.model.getObjectByName('Cube077');
  if (!cushion || !back) return {};
  ctx.model.updateMatrixWorld(true);
  const seat = new THREE.Box3().setFromObject(cushion);
  const rest = new THREE.Box3().setFromObject(back).getCenter(new THREE.Vector3());
  const middle = seat.getCenter(new THREE.Vector3());
  const along = seat.max.x - seat.min.x > seat.max.z - seat.min.z ? 'x' : 'z';
  const toBack = new THREE.Vector3(rest.x - middle.x, 0, rest.z - middle.z);
  toBack[along] = 0;
  toBack.normalize();

  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [];
  const mat = (color: number, roughness = 0.85) => { const m = new THREE.MeshStandardMaterial({ color, roughness }); materials.push(m); return m; };
  const fabric = mat(0x18181b), pocketFabric = mat(0x232327), webbing = mat(0x101012), metal = mat(0x8a8d94, 0.35);
  const piece = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, rx = 0) => {
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rx;
    pack.add(mesh);
    return mesh;
  };

  const pack = new THREE.Group();
  pack.name = 'room_backpack';
  piece(new RoundedBoxGeometry(SIZE.x, SIZE.y, SIZE.z, 4, 0.05), fabric, 0, SIZE.y / 2, 0);
  piece(new RoundedBoxGeometry(SIZE.x * 0.72, SIZE.y * 0.36, 0.05, 3, 0.02), pocketFabric, 0, SIZE.y * 0.27, SIZE.z / 2 + 0.012);
  piece(new THREE.BoxGeometry(SIZE.x * 0.6, 0.004, 0.004), metal, 0, SIZE.y * 0.45, SIZE.z / 2 + 0.038);
  piece(new THREE.CylinderGeometry(0.025, 0.025, 0.004, 20), mat(0xeef0f6), 0, SIZE.y * 0.66, SIZE.z / 2 + 0.002, Math.PI / 2);
  piece(new THREE.TorusGeometry(0.035, 0.008, 8, 20, Math.PI), webbing, 0, SIZE.y + 0.005, 0);
  for (const x of [-0.08, 0.08]) piece(new THREE.BoxGeometry(0.05, SIZE.y * 0.85, 0.012), webbing, x, SIZE.y * 0.5, -SIZE.z / 2 - 0.008);
  const charm = new THREE.Group();
  charm.position.set(SIZE.x * 0.42, SIZE.y * 0.42, SIZE.z / 2 + 0.01);
  const ringGeometry = new THREE.TorusGeometry(0.009, 0.0018, 6, 16);
  const tagGeometry = new RoundedBoxGeometry(0.03, 0.03, 0.006, 2, 0.006);
  const markGeometry = new THREE.BoxGeometry(0.014, 0.003, 0.001);
  geometries.push(ringGeometry, tagGeometry, markGeometry);
  charm.add(new THREE.Mesh(ringGeometry, metal));
  const tag = new THREE.Mesh(tagGeometry, mat(0x7d97ec, 0.6));
  tag.position.y = -0.026;
  const mark = new THREE.Mesh(markGeometry, mat(0xffffff));
  mark.position.set(0, -0.03, 0.0036);
  charm.add(tag, mark);
  pack.add(charm);

  const end = new THREE.Vector3().copy(middle);
  end[along] = seat.max[along] - SIZE.x / 2 - 0.06;
  end.addScaledVector(toBack, (along === 'x' ? seat.max.z - seat.min.z : seat.max.x - seat.min.x) * 0.22);
  end.y = seat.max.y;
  pack.position.copy(end);
  pack.rotation.order = 'YXZ';
  pack.rotation.y = Math.atan2(-toBack.x, -toBack.z);
  pack.rotation.x = -LEAN;
  ctx.model.add(pack);
  ctx.model.updateMatrixWorld(true);

  ctx.addTarget({
    object: pack,
    label: 'Backpack',
    detail: 'Black daypack · laptop sleeve · terminal keychain',
    action: () => 'Check the backpack',
    use: () => 'Charger, notebook and a spare USB-C cable',
  });

  return {
    dispose() {
      pack.removeFromParent();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
};
