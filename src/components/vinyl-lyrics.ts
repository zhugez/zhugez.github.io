export type Line = { t: number; text: string; words: string[]; times: number[]; end: number };
export type Lyrics = Line[];

const STAMP = /\[(\d+):(\d{1,2}(?:[.:]\d+)?)\]/g;
const seconds = (m: string, s: string) => Number(m) * 60 + Number(s.replace(':', '.'));

export function parseLrc(text: string): Lyrics {
  const offset = Number(/^\[offset:\s*([+-]?\d+)\s*\]/im.exec(text)?.[1] ?? 0) / 1000;
  const lines: Lyrics = [];
  for (const raw of text.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(STAMP)];
    if (!stamps.length) continue;
    const last = stamps[stamps.length - 1];
    const body = raw.slice(last.index! + last[0].length);
    const first = seconds(stamps[0][1], stamps[0][2]);
    const words: string[] = [], tags: (number | null)[] = [];
    let tag: number | null = null;
    for (const [, m, s, word] of body.matchAll(/<(\d+):(\d{1,2}(?:[.:]\d+)?)>|(\S+)/g)) {
      if (word) { words.push(word); tags.push(tag); tag = null; } else tag = seconds(m, s) - first;
    }
    for (const [, m, s] of stamps) {
      const t = Math.max(0, seconds(m, s) - offset);
      lines.push({ t, text: words.join(' '), words, times: tags.map((rel) => rel === null ? NaN : t + rel), end: t });
    }
  }
  lines.sort((a, b) => a.t - b.t);
  lines.forEach((line, i) => {
    const gap = (lines[i + 1]?.t ?? line.t + 4) - line.t;
    // ponytail: no real word tags, so spread words over the sung span. Fill the slot when the gap is plausible for
    // the line, and cap the rate at 1.4 s a word so a short line does not crawl through a long instrumental gap.
    const span = Math.max(0, Math.min(gap - 0.1, line.words.length * 1.4));
    const weights = line.words.map((word) => word.length + 2), total = weights.reduce((a, b) => a + b, 0);
    let acc = 0;
    line.times = line.times.map((time, k) => {
      const guess = line.t + span * acc / total;
      acc += weights[k];
      return Number.isFinite(time) ? time : guess;
    });
    // The line is gone once its last word is sung, so an old line never hangs over an instrumental gap.
    line.end = Math.min(line.t + gap, (line.times.at(-1) ?? line.t) + 1.2);
  });
  return lines;
}

export function lineAt(lyrics: Lyrics, t: number) {
  let lo = 0, hi = lyrics.length - 1, found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lyrics[mid].t <= t) { found = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return found;
}

/** The line being sung at `t`, or null when the line already finished (musical gap, intro, outro). */
export function lineAtTime(lyrics: Lyrics, t: number): Line | null {
  const line = lyrics[lineAt(lyrics, t)];
  return line && t < line.end ? line : null;
}

export function wordsSung(line: Line, t: number) {
  let n = 0;
  while (n < line.times.length && line.times[n] <= t) n++;
  return n;
}
