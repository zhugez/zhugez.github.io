import * as THREE from 'three';

export function toonify(root: THREE.Object3D) {
  const ramp = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
  ramp.needsUpdate = true;
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh) || !(node.material instanceof THREE.MeshStandardMaterial)) return;
    const source = node.material;
    node.material = /^(shine|unlit)/.test(source.name)
      ? new THREE.MeshBasicMaterial({ color: source.color, map: source.map, transparent: source.transparent, alphaTest: source.alphaTest })
      : new THREE.MeshToonMaterial({ color: source.color, map: source.map, gradientMap: ramp, transparent: source.transparent, alphaTest: source.alphaTest });
    source.dispose();
  });
  return ramp;
}
