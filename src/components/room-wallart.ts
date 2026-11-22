import * as THREE from 'three';
import { WORD } from './feature-ledsync';

export type WallPiece = { mesh: THREE.Mesh; label: string; detail: string };

const POSTERS: [string, string, string][] = [
  ['poster-break.webp', 'Break the code', 'Poster · glitch print'],
  ['poster-live.webp', 'We live in the code', 'Poster · monochrome print'],
  ['poster-hello.webp', 'Hello, friend', 'Poster · designed for this studio'],
];
const POSTER_NODES = ['Cube031', 'Cube032', 'Cube035'];
const SPEAKER_NODES = ['Cube061', 'Cube130'];

export function hangWallArt(model: THREE.Object3D, base: URL, anisotropy: number) {
  const group = new THREE.Group();
  group.name = 'wall_art';
  const pieces: WallPiece[] = [];
  const textures: THREE.Texture[] = [];
  const loader = new THREE.TextureLoader();
  const load = (file: string) => {
    const texture = loader.load(new URL(`media/wall/${file}`, base).href);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropy;
    textures.push(texture);
    return texture;
  };

  for (const name of SPEAKER_NODES) model.getObjectByName(name)?.removeFromParent();
  model.updateMatrixWorld(true);
  const room = new THREE.Box3().setFromObject(model);
  const middle = room.getCenter(new THREE.Vector3());

  const frames = POSTER_NODES.map((name) => model.getObjectByName(name)).filter((node): node is THREE.Object3D => !!node);
  frames.sort((a, b) => new THREE.Box3().setFromObject(a).getCenter(new THREE.Vector3()).x - new THREE.Box3().setFromObject(b).getCenter(new THREE.Vector3()).x);
  frames.forEach((frame, i) => {
    const [file, label, detail] = POSTERS[i % POSTERS.length];
    const box = new THREE.Box3().setFromObject(frame);
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const thinX = size.x < size.z;
    const width = (thinX ? size.z : size.x) * 0.86, height = size.y * 0.88;
    const material = new THREE.MeshStandardMaterial({ map: load(file), roughness: 0.62, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.12 });
    material.emissiveMap = material.map;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    const sign = Math.sign((thinX ? middle.x - center.x : middle.z - center.z)) || 1;
    if (thinX) {
      mesh.position.set(sign > 0 ? box.max.x + 0.003 : box.min.x - 0.003, center.y, center.z);
      mesh.rotation.y = sign * Math.PI / 2;
    } else {
      mesh.position.set(center.x, center.y, sign > 0 ? box.max.z + 0.003 : box.min.z - 0.003);
      mesh.rotation.y = sign > 0 ? 0 : Math.PI;
    }
    mesh.name = `wall_poster_${i}`;
    group.add(mesh);
    pieces.push({ mesh, label, detail });
  });

  const ray = new THREE.Raycaster(new THREE.Vector3(middle.x, room.min.y + 1.8, middle.z), new THREE.Vector3(1, 0, 0));
  const wall = ray.intersectObject(model, true).find((hit) => hit.distance > 1)?.point.x ?? room.max.x - 0.2;
  const circuit = new THREE.MeshBasicMaterial({ map: load('circuit.webp'), color: 0x7d97ec, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.9, side: THREE.DoubleSide });
  const bottom = WORD.y + WORD.height / 2 + 0.04, top = Math.min(room.max.y - 0.08, bottom + 1.23);
  const mural = new THREE.Mesh(new THREE.PlaneGeometry((top - bottom) * 0.78 / 1.23, top - bottom), circuit);
  mural.position.set(wall - 0.004, (bottom + top) / 2, WORD.z);
  mural.rotation.y = -Math.PI / 2;
  mural.name = 'wall_circuit';
  group.add(mural);
  pieces.push({ mesh: mural, label: 'Circuit mural', detail: 'Wall decal · traces in the site accent' });

  model.add(group);
  return {
    pieces,
    tint(color: THREE.Color) {
      circuit.color.copy(color);
    },
    dispose() {
      group.removeFromParent();
      group.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        node.geometry.dispose();
        (node.material as THREE.Material).dispose();
      });
      textures.forEach((texture) => texture.dispose());
    },
  };
}
