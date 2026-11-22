const ROW = ['KeyA', 'KeyW', 'KeyS', 'KeyE', 'KeyD', 'KeyF', 'KeyT', 'KeyG', 'KeyY', 'KeyH', 'KeyU', 'KeyJ', 'KeyK', 'KeyO', 'KeyL', 'KeyP', 'Semicolon'];
export const MIN_BASE = 24;
export const MAX_BASE = 84;

export const shiftOctave = (base: number, delta: number) => Math.min(MAX_BASE, Math.max(MIN_BASE, base + delta * 12));

export function computerKey(code: string, base: number): number | null {
  const index = ROW.indexOf(code);
  return index < 0 ? null : base + index;
}

export const keyLegend = (base: number) => ROW.map((code, i) => ({ key: code.replace('Key', '').replace('Semicolon', ';'), midi: base + i }));

const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const noteName = (midi: number) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
export const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(midi % 12);
