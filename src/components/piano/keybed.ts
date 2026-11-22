export const LOWEST = 21;
export const HIGHEST = 108;

export type KeybedOutput = {
  attack(midi: number, velocity: number): void;
  release(midi: number): void;
  visual(midi: number, down: boolean): void;
};

export const isPianoNote = (midi: number) => Number.isInteger(midi) && midi >= LOWEST && midi <= HIGHEST;

export class Keybed {
  #holders = new Map<number, Set<string>>();
  #sounding = new Set<number>();
  #pedal = false;
  #out: KeybedOutput;

  constructor(out: KeybedOutput) {
    this.#out = out;
  }

  get pedal() {
    return this.#pedal;
  }

  isDown(midi: number) {
    return this.#holders.has(midi);
  }

  isSounding(midi: number) {
    return this.#sounding.has(midi);
  }

  heldBy(source: string) {
    return [...this.#holders].filter(([, set]) => set.has(source)).map(([midi]) => midi);
  }

  press(source: string, midi: number, velocity = 0.8) {
    if (!isPianoNote(midi)) return false;
    let holders = this.#holders.get(midi);
    if (holders?.has(source)) return false;
    if (!holders) {
      holders = new Set();
      this.#holders.set(midi, holders);
      this.#out.visual(midi, true);
    }
    holders.add(source);
    if (this.#sounding.has(midi)) this.#out.release(midi);
    this.#sounding.add(midi);
    this.#out.attack(midi, Math.min(1, Math.max(0.05, velocity)));
    return true;
  }

  release(source: string, midi: number) {
    const holders = this.#holders.get(midi);
    if (!holders?.delete(source)) return false;
    if (holders.size) return true;
    this.#holders.delete(midi);
    this.#out.visual(midi, false);
    if (!this.#pedal) this.#silence(midi);
    return true;
  }

  slide(source: string, midi: number, velocity = 0.8) {
    const held = this.heldBy(source);
    if (held.length === 1 && held[0] === midi) return false;
    held.forEach((note) => this.release(source, note));
    return this.press(source, midi, velocity);
  }

  releaseSource(source: string) {
    this.heldBy(source).forEach((midi) => this.release(source, midi));
  }

  setPedal(down: boolean) {
    this.#pedal = down;
    if (down) return;
    for (const midi of [...this.#sounding]) if (!this.#holders.has(midi)) this.#silence(midi);
  }

  releaseAll() {
    this.#pedal = false;
    for (const midi of [...this.#holders.keys()]) this.#out.visual(midi, false);
    this.#holders.clear();
    for (const midi of [...this.#sounding]) this.#silence(midi);
  }

  #silence(midi: number) {
    if (this.#sounding.delete(midi)) this.#out.release(midi);
  }
}
