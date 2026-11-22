import assert from 'node:assert/strict';
import { Grid, hits, rectDistance, step } from '../src/components/collide.ts';

const area = { x0: 0, z0: 0, x1: 4, z1: 3 };
const wall = { x0: 1.8, z0: 0, x1: 2.2, z1: 2.4 };
const r = 0.2;

assert.equal(rectDistance(1, 1, wall), 0.8);
assert.equal(hits(1.65, 1, r, [wall], area), true);
assert.equal(hits(1.5, 1, r, [wall], area), false);
assert.equal(hits(0.1, 1, r, [], area), true, 'area edge blocks the footprint');

let [x, z] = step(1, 1, 2, 0, r, [wall], area);
assert.ok(x <= wall.x0 - r + 1e-9 && x > 1.5, `stops at the wall face, got ${x}`);
assert.equal(z, 1);

[x, z] = step(1, 1, 1, 0.5, r, [wall], area);
assert.ok(x <= wall.x0 - r + 1e-9 && z > 1.4, `slides along the wall, got ${x},${z}`);

[x, z] = step(1, 1, 50, 0, r, [wall], area);
assert.ok(x < wall.x0, 'one huge step cannot tunnel through');

const corner = { x0: 1, z0: 1, x1: 2, z1: 2 };
[x, z] = step(0.5, 0.5, 1, 1, r, [corner], area);
assert.ok(rectDistance(x, z, corner) >= r - 1e-9, 'diagonal approach does not clip the corner');

const grid = new Grid(area, 0.1, r, [wall]);
const route = grid.path(1, 1, (cx, cz) => Math.hypot(cx - 3, cz - 1) < 0.1);
assert.ok(route && route.length > 20, 'finds a detour around the wall');
assert.ok(route.every(([px, pz]) => !hits(px, pz, r, [wall], area)), 'every waypoint keeps clearance');
assert.ok(Math.max(...route.map(([, pz]) => pz)) > wall.z1, 'route goes around the open end');
assert.equal(grid.path(1, 1, (cx) => cx > 3.9), null, 'unreachable goal returns null');
assert.equal(grid.free[grid.index(2, 1)], 0, 'cells inside the wall are blocked');
assert.equal(grid.free[grid.index(1, 1)], 1);

console.log('PASS: footprint collision, wall slide, no tunnelling, corner clearance, grid detour path, unreachable goal.');
