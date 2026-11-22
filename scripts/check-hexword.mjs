import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createHexWord, layoutHexWord } from '../src/components/room-hexword.ts';

const radius = 0.04;
const layout = layoutHexWord('ZhugeZ', radius);
const { tiles, width, height } = layout;
assert.equal(layout.letters, 6);
assert.ok(tiles.length > 40, `tiles ${tiles.length}`);
for (const t of tiles) {
  assert.ok(Math.abs(t.x) <= width / 2 + 1e-9 && Math.abs(t.y) <= height / 2 + 1e-9, `tile out of bounds ${t.x},${t.y}`);
}
const limit = 2 * radius * 0.86;
for (let i = 0; i < tiles.length; i++) {
  for (let j = i + 1; j < tiles.length; j++) {
    const d = Math.hypot(tiles[i].x - tiles[j].x, tiles[i].y - tiles[j].y);
    assert.ok(d >= limit, `tiles ${i},${j} too close: ${d}`);
  }
}
const byLetter = [0, 1, 2, 3, 4, 5].map((k) => tiles.filter((t) => t.letter === k));
byLetter.forEach((group, k) => assert.ok(group.length > 0, `letter ${k} missing`));
for (let k = 0; k < 5; k++) {
  const right = Math.max(...byLetter[k].map((t) => t.x));
  const left = Math.min(...byLetter[k + 1].map((t) => t.x));
  assert.ok(right < left, `letter ${k} overlaps letter ${k + 1}`);
}
const shape = (group) => {
  const c0 = Math.min(...group.map((t) => t.col));
  return group.map((t) => `${t.col - c0},${t.row}`).sort().join(' ');
};
assert.equal(shape(byLetter[0]), shape(byLetter[5]), 'both Zs share one shape');
assert.deepEqual(layoutHexWord('ZhugeZ', radius), layout, 'deterministic');

const cameraRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0));
assert.ok(cameraRight.distanceTo(new THREE.Vector3(1, 0, 0)) < 1e-9, 'right = forward x up (default camera reads toward +x)');

const center = new THREE.Vector3(2.8, 2.15, 0.4);
const word = createHexWord({ center, normal: new THREE.Vector3(-1, 0, 0), maxWidth: 2.2, maxHeight: 0.5 });
const count = word.mesh.count;
assert.equal(count, tiles.length);
assert.equal(word.mesh.name, 'hex_wordmark');
assert.equal(word.mesh.userData.roomLabel, 'ZhugeZ');
const viewerForward = new THREE.Vector3(1, 0, 0);
const viewerRight = new THREE.Vector3().crossVectors(viewerForward, new THREE.Vector3(0, 1, 0));
assert.ok(viewerRight.distanceTo(new THREE.Vector3(0, 0, 1)) < 1e-9, 'viewer looking along -normal reads toward +z');
const m = new THREE.Matrix4();
const p = new THREE.Vector3();
const pos = [];
for (let i = 0; i < count; i++) {
  word.mesh.getMatrixAt(i, m);
  p.setFromMatrixPosition(m);
  pos.push(p.clone());
  assert.ok(Math.abs(p.x - 2.79) < 1e-6, `instance ${i} off wall plane x=${p.x}`);
  assert.ok(Math.abs(p.z - center.z) <= 1.1 && Math.abs(p.y - center.y) <= 0.25, `instance ${i} outside 2.2x0.5`);
}
const r = word.mesh.geometry.parameters.radiusTop / 0.9;
const zs = pos.map((q) => q.z);
const ys = pos.map((q) => q.y);
assert.ok(Math.max(...zs) - Math.min(...zs) + Math.sqrt(3) * r <= 2.2 + 1e-9, 'tile extent fits 2.2 wide');
assert.ok(Math.max(...ys) - Math.min(...ys) + 2 * r <= 0.5 + 1e-9, 'tile extent fits 0.5 high');
for (let i = 0; i < count; i++) {
  for (let j = 0; j < count; j++) {
    if (pos[j].dot(viewerRight) > pos[i].dot(viewerRight) + 1e-9) assert.ok(word.u[j] > word.u[i], `u must increase toward viewer right (${i},${j})`);
  }
}
const firstZ = pos.reduce((a, q, i) => (q.z < pos[a].z ? i : a), 0);
assert.equal(word.u[firstZ], 0);
word.mesh.getMatrixAt(0, m);
const n = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion().setFromRotationMatrix(m));
assert.ok(n.distanceTo(new THREE.Vector3(-1, 0, 0)) < 1e-6, 'hexagon faces along normal');
const fullLayout = layoutHexWord('ZhugeZ', r);
const finalZ = Math.min(...pos.filter((_, i) => fullLayout.tiles[i].letter === 5).map((q) => q.z));
for (let i = 0; i < count; i++) {
  assert.equal(word.last[i], fullLayout.tiles[i].letter === 5 ? 1 : 0, `last mismatch at ${i}`);
  assert.equal(word.last[i] === 1, pos[i].z >= finalZ - 1e-9, `last must mark the rightmost letter (${i})`);
}
assert.ok(word.light.position.distanceTo(new THREE.Vector3(2.5, 2.15, 0.4)) < 1e-9);
assert.equal(word.light.intensity, 0.6);
assert.equal(word.light.distance, 1.6);
const rgb = new Float32Array(count * 3).fill(1.05);
word.setColors(rgb);
assert.equal(word.mesh.instanceColor.array[3 * count - 1], rgb[0]);
assert.ok(word.mesh.instanceColor.version > 0);
const scene = new THREE.Scene();
scene.add(word.mesh, word.light);
word.dispose();
assert.equal(scene.children.length, 0);

const art = [];
for (let row = 0; row < 7; row++) {
  let line = row % 2 ? ' ' : '';
  const maxCol = Math.max(...tiles.map((t) => t.col));
  for (let col = 0; col <= maxCol; col++) {
    const t = tiles.find((q) => q.col === col && q.row === row);
    line += t ? '#' + ' ' : '. ';
  }
  art.push(line.trimEnd());
}
console.log(art.join('\n'));
console.log(`PASS hexword: ${tiles.length} tiles, ${layout.letters} letters, radius ${r.toFixed(4)} m`);
