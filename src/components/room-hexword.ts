import * as THREE from 'three';

export type HexTile = { col: number; row: number; letter: number; x: number; y: number };

const GLYPHS: Record<string, string[]> = {
  Z: ['####', '..#.', '..#.', '.#..', '.#..', '#...', '####'],
  h: ['#...', '#...', '#...', '###.', '#..#', '#..#', '#..#'],
  u: ['....', '....', '#..#', '#..#', '#..#', '#..#', '.###'],
  g: ['....', '....', '.###', '#..#', '#..#', '.###', '...#', '###.'],
  e: ['....', '....', '.##.', '#..#', '####', '#...', '.###'],
};
const ROWS = 8;
const SQRT3 = Math.sqrt(3);
const UP = new THREE.Vector3(0, 1, 0);

export function layoutHexWord(text: string, radius: number) {
  const pitch = SQRT3 * radius;
  const cells: { col: number; row: number; letter: number }[] = [];
  let col0 = 0;
  [...text].forEach((ch, letter) => {
    const glyph = GLYPHS[ch];
    if (!glyph) throw new Error(`no hex glyph for '${ch}'`);
    glyph.forEach((line, row) => {
      for (let c = 0; c < line.length; c++) if (line[c] === '#') cells.push({ col: col0 + c, row, letter });
    });
    col0 += glyph[0].length + 1;
  });
  const cols = col0 - 1;
  const width = (cols - 1 + 0.5) * pitch + pitch;
  const height = (ROWS - 1) * 1.5 * radius + 2 * radius;
  const left = -width / 2 + pitch / 2;
  const top = height / 2 - radius;
  const tiles: HexTile[] = cells.map(({ col, row, letter }) => ({
    col,
    row,
    letter,
    x: left + (col + (row % 2) * 0.5) * pitch,
    y: top - row * 1.5 * radius,
  }));
  return { tiles, width, height, letters: [...text].length };
}

export function createHexWord(opts: { center: THREE.Vector3; normal: THREE.Vector3; maxWidth: number; maxHeight: number; text?: string }) {
  const text = opts.text ?? 'ZhugeZ';
  const unit = layoutHexWord(text, 1);
  const radius = Math.min(opts.maxWidth / unit.width, opts.maxHeight / unit.height);
  const { tiles, letters } = layoutHexWord(text, radius);

  const normal = opts.normal.clone().normalize();
  const right = new THREE.Vector3().crossVectors(UP, normal).normalize();
  const up = new THREE.Vector3().crossVectors(normal, right);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right.clone().negate(), normal, up));
  const origin = opts.center.clone().addScaledVector(normal, 0.01);

  const geometry = new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, 0.018, 6);
  const material = new THREE.MeshBasicMaterial({ toneMapped: false });
  const mesh = new THREE.InstancedMesh(geometry, material, tiles.length);
  mesh.name = 'hex_wordmark';
  mesh.userData.roomLabel = 'ZhugeZ';

  const xs = tiles.map((t) => t.x);
  const minX = Math.min(...xs);
  const spanX = Math.max(...xs) - minX || 1;
  const u = new Float32Array(tiles.length);
  const last = new Uint8Array(tiles.length);
  const cream = new THREE.Color('#ffe8c2');
  const accent = new THREE.Color('#7d97ec');
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3(1, 1, 1);
  const color = new THREE.Color();
  tiles.forEach((t, i) => {
    position.copy(origin).addScaledVector(right, t.x).addScaledVector(up, t.y);
    mesh.setMatrixAt(i, matrix.compose(position, quaternion, scale));
    u[i] = (t.x - minX) / spanX;
    last[i] = t.letter === letters - 1 ? 1 : 0;
    const hash = Math.sin(t.col * 12.9898 + t.row * 78.233) * 43758.5453;
    const jitter = 1 + ((hash - Math.floor(hash)) * 2 - 1) * 0.08;
    mesh.setColorAt(i, color.copy(last[i] ? accent : cream).multiplyScalar(jitter));
  });
  mesh.instanceMatrix.needsUpdate = true;

  const light = new THREE.PointLight(0xffd6a0, 0.6, 1.6);
  light.position.copy(opts.center).addScaledVector(normal, 0.3);

  function setColors(rgb: ArrayLike<number>) {
    const target = mesh.instanceColor.array as Float32Array;
    const n = Math.min(target.length, rgb.length);
    for (let i = 0; i < n; i++) target[i] = rgb[i];
    mesh.instanceColor.needsUpdate = true;
  }

  function dispose() {
    mesh.removeFromParent();
    light.removeFromParent();
    geometry.dispose();
    material.dispose();
    mesh.dispose();
    light.dispose();
  }

  return { mesh, light, u, last, setColors, dispose };
}
