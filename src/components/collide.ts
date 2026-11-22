export type Rect = { x0: number; z0: number; x1: number; z1: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const rectDistance = (x: number, z: number, b: Rect) => Math.hypot(x - clamp(x, b.x0, b.x1), z - clamp(z, b.z0, b.z1));

export function hits(x: number, z: number, r: number, rects: Rect[], area: Rect) {
  if (x - r < area.x0 || x + r > area.x1 || z - r < area.z0 || z + r > area.z1) return true;
  return rects.some((b) => rectDistance(x, z, b) < r);
}

export function step(x: number, z: number, dx: number, dz: number, r: number, rects: Rect[], area: Rect): [number, number] {
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (r * 0.5)));
  const sx = dx / n, sz = dz / n;
  for (let i = 0; i < n; i++) {
    if (!hits(x + sx, z + sz, r, rects, area)) { x += sx; z += sz; }
    else if (sx && !hits(x + sx, z, r, rects, area)) x += sx;
    else if (sz && !hits(x, z + sz, r, rects, area)) z += sz;
    else break;
  }
  return [x, z];
}

export class Grid {
  readonly cols: number;
  readonly rows: number;
  readonly free: Uint8Array;
  readonly area: Rect;
  readonly cell: number;

  constructor(area: Rect, cell: number, r: number, rects: Rect[]) {
    this.area = area;
    this.cell = cell;
    this.cols = Math.max(1, Math.floor((area.x1 - area.x0) / cell));
    this.rows = Math.max(1, Math.floor((area.z1 - area.z0) / cell));
    this.free = new Uint8Array(this.cols * this.rows);
    for (let i = 0; i < this.free.length; i++) {
      const [x, z] = this.center(i);
      this.free[i] = hits(x, z, r, rects, area) ? 0 : 1;
    }
  }

  center(i: number): [number, number] {
    return [this.area.x0 + (i % this.cols + 0.5) * this.cell, this.area.z0 + (Math.floor(i / this.cols) + 0.5) * this.cell];
  }

  index(x: number, z: number) {
    const c = clamp(Math.floor((x - this.area.x0) / this.cell), 0, this.cols - 1);
    const r = clamp(Math.floor((z - this.area.z0) / this.cell), 0, this.rows - 1);
    return r * this.cols + c;
  }

  path(x: number, z: number, done: (x: number, z: number) => boolean): [number, number][] | null {
    const startIndex = this.index(x, z);
    const cost = new Float64Array(this.free.length).fill(Infinity);
    const from = new Int32Array(this.free.length).fill(-1);
    const heap: [number, number][] = [[0, startIndex]];
    cost[startIndex] = 0;
    while (heap.length) {
      const [c, i] = pop(heap);
      if (c > cost[i]) continue;
      const [cx, cz] = this.center(i);
      if (done(cx, cz)) {
        const route: [number, number][] = [];
        for (let k = i; k !== startIndex; k = from[k]) route.push(this.center(k));
        return route.reverse();
      }
      const col = i % this.cols, row = Math.floor(i / this.cols);
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nc = col + dc, nr = row + dr;
        if (nc < 0 || nr < 0 || nc >= this.cols || nr >= this.rows) continue;
        const j = nr * this.cols + nc;
        if (!this.free[j] || (dr && dc && (!this.free[row * this.cols + nc] || !this.free[nr * this.cols + col]))) continue;
        const next = c + (dr && dc ? Math.SQRT2 : 1);
        if (next < cost[j]) { cost[j] = next; from[j] = i; push(heap, [next, j]); }
      }
    }
    return null;
  }
}

function push(heap: [number, number][], item: [number, number]) {
  heap.push(item);
  for (let i = heap.length - 1; i > 0;) {
    const p = (i - 1) >> 1;
    if (heap[p][0] <= heap[i][0]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

function pop(heap: [number, number][]) {
  const top = heap[0], last = heap.pop()!;
  if (heap.length) {
    heap[0] = last;
    for (let i = 0; ;) {
      const l = 2 * i + 1, r = l + 1;
      let m = i;
      if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
      if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
      if (m === i) break;
      [heap[m], heap[i]] = [heap[i], heap[m]];
      i = m;
    }
  }
  return top;
}
