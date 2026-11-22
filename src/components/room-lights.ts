export type LedMode = 'sync' | 'static' | 'off';
export type LedState = {
  time: number;
  playing: boolean;
  note: number;
  noteAt: number;
  hue: number;
  light: boolean;
  mode: LedMode;
  still: boolean;
  ambient?: [number, number, number][];
};

export const SKYDIMO_ZONES = 23;

const HUE_MIN = 210;
const HUE_MAX = 270;
const ACCENT2_SHIFT = 28;
const BREATH_PERIOD = 6;
const KICK_DECAY = 0.45;
const WAVE_SPEED = 0.6;
const MAX_OUT = 1.4;

const finite = (v: number, fallback: number) => (Number.isFinite(v) ? v : fallback);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, finite(v, lo)));

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const SRGB_TABLE = Array.from({ length: 256 }, (_, i) => srgbToLinear(i / 255));

export function zoneU(i: number): number {
  return clamp(i / (SKYDIMO_ZONES - 1), 0, 1);
}

export function hslToLinear(h: number, s: number, l: number): [number, number, number] {
  const hh = ((finite(h, 0) % 360) + 360) % 360;
  const ss = clamp(s, 0, 1);
  const ll = clamp(l, 0, 1);
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + hh / 30) % 12;
    return srgbToLinear(clamp(ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)), 0, 1));
  };
  return [f(0), f(8), f(4)];
}

const baseHue = (s: LedState) => finite(s.hue, 226);
const lightness = (s: LedState) => (s.light ? 0.45 : 0.62);
const steady = (s: LedState) => s.mode === 'static' || (s.mode === 'sync' && s.still);
const hasNote = (s: LedState) => s.playing && s.note >= 0 && Number.isFinite(s.note);

function noteAge(s: LedState): number {
  if (!hasNote(s)) return Infinity;
  const dt = finite(s.time, 0) - finite(s.noteAt, -Infinity);
  return dt >= 0 ? dt : Infinity;
}

function noteKick(u: number, s: LedState): number {
  const dt = noteAge(s);
  if (dt === Infinity) return 0;
  const decay = Math.max(0, 1 - dt / KICK_DECAY);
  const front = dt * WAVE_SPEED;
  const wave = Math.exp(-(((Math.abs(u - 0.5) - front) / 0.08) ** 2)) * Math.max(0, 1 - dt / 1.2);
  return 0.35 * decay * decay + 0.3 * wave;
}

export function ledHue(u: number, s: LedState): number {
  const hue = baseHue(s);
  if (s.mode !== 'sync' || s.still) return hue;
  const t = finite(s.time, 0);
  const g = 0.5 - 0.5 * Math.cos(2 * Math.PI * (clamp(u, 0, 1) - t * 0.05));
  let h = hue + ACCENT2_SHIFT * g;
  if (hasNote(s)) {
    h += ((Math.floor(s.note) * 5) % 9) * 4 - 12;
    h = clamp(h, HUE_MIN, HUE_MAX);
  }
  return h;
}

export function ledColor(u: number, s: LedState, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
  if (s.mode === 'off') {
    out[0] = out[1] = out[2] = 0;
    return out;
  }
  const uu = clamp(u, 0, 1);
  const accent = hslToLinear(ledHue(uu, s), 0.72, lightness(s));
  const [r, g, b] = accent;
  if (steady(s)) {
    out[0] = r;
    out[1] = g;
    out[2] = b;
    return out;
  }
  const kick = noteKick(uu, s);
  const amb = s.ambient;
  if (amb && amb.length) {
    const p = uu * (amb.length - 1);
    const i = Math.min(amb.length - 1, Math.floor(p));
    const j = Math.min(amb.length - 1, i + 1);
    const f = p - i;
    const gain = 1 + kick;
    for (let c = 0; c < 3; c++) {
      const a = clamp(amb[i][c], 0, 1) * (1 - f) + clamp(amb[j][c], 0, 1) * f;
      out[c] = clamp((0.7 * a + 0.3 * accent[c]) * gain, 0, MAX_OUT);
    }
    return out;
  }
  const breath = 0.55 + 0.3 * (0.5 - 0.5 * Math.cos((2 * Math.PI * finite(s.time, 0)) / BREATH_PERIOD));
  const gain = breath + kick;
  out[0] = clamp(r * gain, 0, MAX_OUT);
  out[1] = clamp(g * gain, 0, MAX_OUT);
  out[2] = clamp(b * gain, 0, MAX_OUT);
  return out;
}

export function ledBusy(s: LedState): boolean {
  return s.mode === 'sync' && !s.still;
}

export function nextMode(m: LedMode): LedMode {
  return m === 'sync' ? 'static' : m === 'static' ? 'off' : 'sync';
}

export function edgeSamples(pixels: ArrayLike<number>, width: number, height: number, count: number): [number, number, number][] {
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  const n = Math.max(0, Math.floor(count));
  const length = h + w + h;
  const depth = Math.max(1, Math.round(Math.min(w, h) * 0.1));
  const half = length / (2 * Math.max(1, n));
  const result: [number, number, number][] = [];
  for (let k = 0; k < n; k++) {
    const centre = n > 1 ? (k / (n - 1)) * length : length / 2;
    const start = Math.max(0, centre - half);
    const end = Math.min(length, centre + half);
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let taken = 0;
    for (let s = start + 0.5; s < end || taken === 0; s += 1) {
      const pos = Math.min(length - 1e-6, Math.max(0, s));
      let x: number;
      let y: number;
      let dx = 0;
      let dy = 0;
      if (pos < h) {
        x = 0;
        y = h - 1 - Math.floor(pos);
        dx = 1;
      } else if (pos < h + w) {
        x = Math.floor(pos - h);
        y = 0;
        dy = 1;
      } else {
        x = w - 1;
        y = Math.floor(pos - h - w);
        dx = -1;
      }
      for (let d = 0; d < depth; d++) {
        const px = Math.min(w - 1, Math.max(0, x + dx * d));
        const py = Math.min(h - 1, Math.max(0, y + dy * d));
        const o = (py * w + px) * 4;
        sr += SRGB_TABLE[clamp(Math.round(pixels[o] ?? 0), 0, 255)];
        sg += SRGB_TABLE[clamp(Math.round(pixels[o + 1] ?? 0), 0, 255)];
        sb += SRGB_TABLE[clamp(Math.round(pixels[o + 2] ?? 0), 0, 255)];
        taken++;
      }
    }
    result.push([sr / taken, sg / taken, sb / taken]);
  }
  return result;
}
