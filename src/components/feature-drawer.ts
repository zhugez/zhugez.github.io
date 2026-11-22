import * as THREE from 'three';
import type { FeatureFactory } from './room-feature';

const TRAVEL = 0.22;

export const drawerFeature: FeatureFactory = (ctx) => {
  const drawer = ctx.model.getObjectByName('desk_right_drawer');
  const front = ctx.model.getObjectByName('drawer_front');
  const plate = ctx.model.getObjectByName('drawer_lower_box');
  if (!drawer?.parent || !front || !plate) return {};
  ctx.model.updateMatrixWorld(true);
  const shell = new THREE.Box3().setFromObject(front);
  const floor = new THREE.Box3().setFromObject(plate);
  const geometries: THREE.BufferGeometry[] = [], materials: THREE.Material[] = [];

  const put = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, yaw = 0, tilt = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(tilt, yaw, 0, 'YXZ');
    mesh.updateMatrixWorld();
    drawer.attach(mesh);
    geometries.push(geometry);
    materials.push(material);
    return mesh;
  };

  const top = floor.max.y, cz = (floor.min.z + floor.max.z) / 2;
  const inner = shell.max.x + 0.02;
  put(new THREE.BoxGeometry(0.15, 0.014, 0.2), new THREE.MeshStandardMaterial({ color: 0x1d2440, roughness: 0.8 }), inner + 0.09, top + 0.007, cz - 0.05, 0.08);
  put(new THREE.BoxGeometry(0.13, 0.002, 0.17), new THREE.MeshStandardMaterial({ color: 0xece6d8, roughness: 0.9 }), inner + 0.09, top + 0.015, cz - 0.05, 0.08);
  put(new THREE.CylinderGeometry(0.004, 0.004, 0.13, 8), new THREE.MeshStandardMaterial({ color: ctx.accent, roughness: 0.4 }), inner + 0.05, top + 0.005, cz + 0.08, 0.3, Math.PI / 2);
  put(new THREE.TorusGeometry(0.025, 0.006, 6, 16), new THREE.MeshStandardMaterial({ color: 0x2b2f38, roughness: 0.7 }), inner + 0.15, top + 0.006, cz + 0.07, 0, Math.PI / 2);

  const reach = put(new THREE.BoxGeometry(TRAVEL, shell.max.y - shell.min.y, shell.max.z - shell.min.z), new THREE.MeshBasicMaterial(), shell.min.x - TRAVEL / 2, (shell.min.y + shell.max.y) / 2, (shell.min.z + shell.max.z) / 2);
  reach.visible = false;
  reach.raycast = () => {};

  const rest = drawer.position.clone();
  const origin = drawer.getWorldPosition(new THREE.Vector3());
  const slide = drawer.parent.worldToLocal(origin.clone().add(new THREE.Vector3(-TRAVEL, 0, 0))).sub(drawer.parent.worldToLocal(origin.clone()));
  let open = false, t = 0;

  ctx.addTarget({
    object: drawer,
    label: 'Desk drawer',
    detail: 'Notebook, a pen and a spare cable',
    hover: () => open ? 'Desk drawer · close' : 'Desk drawer · open',
    action: () => open ? 'Close the drawer' : 'Open the drawer',
    use: () => {
      open = !open;
      ctx.start();
      return open ? 'Notebook, a pen and a spare cable' : 'Closed';
    },
  });

  return {
    frame({ dt, animate }) {
      const goal = open ? 1 : 0;
      if (t === goal) return false;
      t = animate ? t + (goal - t) * (1 - Math.exp(-dt * 9)) : goal;
      if (Math.abs(goal - t) < 0.002) t = goal;
      drawer.position.copy(rest).addScaledVector(slide, t * t * (3 - 2 * t));
      return t !== goal;
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
};
