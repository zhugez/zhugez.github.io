// Regenerates public/media/vinyl/lyrics/*.lrc from pinned lrclib.net submissions.
// Each id was chosen because its duration matches the encoded side file (Adele · 30, side split in
// feature-turntable.ts). The Music Video timing that shipped before started 10.6 s late, so the ids are
// pinned here instead of searching at build time and picking whatever ranks first.
// Run: node scripts/fetch-lyrics.mjs   (needs network; not part of npm test)
import { writeFileSync, mkdirSync } from 'node:fs';

const TRACKS = [
  ['A1', 'Strangers By Nature', 19191721, 182.16],
  ['A2', 'Easy On Me', 12898355, 224.69],
  ['A3', 'My Little Love', 18604489, 389.11],
  ['B1', 'Cry Your Heart Out', 18263535, 255.28],
  ['B2', 'Oh My God', 20913211, 225.15],
  ['B3', 'Can I Get It', 18285423, 210.38],
  ['C1', 'I Drink Wine', 19499817, 376.17],
  ['C2', 'All Night Parking (with Erroll Garner) Interlude', 18741701, 161.83],
  ['C3', 'Woman Like Me', 19843615, 300.25],
  ['D1', 'Hold On', 2596344, 366],
  ['D2', 'To Be Loved', 18604479, 403.96],
  ['D3', 'Love Is A Game', 19808434, 403.04],
];

const dir = new URL('../public/media/vinyl/lyrics/', import.meta.url);
mkdirSync(dir, { recursive: true });
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

for (const [code, title, id, seconds] of TRACKS) {
  const response = await fetch(`https://lrclib.net/api/get/${id}`, {
    headers: { 'User-Agent': 'lyngocvu-profile/1.0 (https://lyngocvu.tech)' },
  });
  if (!response.ok) throw new Error(`${code}: lrclib ${response.status}`);
  const hit = await response.json();
  if (!hit.syncedLyrics) throw new Error(`${code}: submission ${id} has no synced lyrics`);
  if (Math.abs((hit.duration ?? 0) - seconds) > 2) throw new Error(`${code}: duration ${hit.duration} does not match the audio (${seconds}s)`);
  const head = `[ar:Adele]\n[al:30]\n[ti:${title}]\n[length:${mmss(seconds)}]\n[re:lrclib.net]\n[ve:lrclib-${id}]\n`;
  writeFileSync(new URL(`${code}.lrc`, dir), head + hit.syncedLyrics.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd() + '\n');
  console.log(`${code} ok ${id} ${(hit.syncedLyrics.match(/^\[\d/mg) || []).length} lines`);
}
