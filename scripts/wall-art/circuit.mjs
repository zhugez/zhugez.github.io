export function circuitSvg({ width = 1200, height = 760, color = '#ffffff', stroke = 7, seed = 7 } = {}) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const cx = width / 2, cy = height / 2, half = 105, pins = 9, gap = (half * 2) / (pins + 1);
  const parts = [];
  const line = (pts) => parts.push(`<polyline points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`);
  const pad = (x, y, r = 13) => parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`);
  const block = (x, y, w, h) => parts.push(`<rect x="${(x - w / 2).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w}" height="${h}" rx="3" fill="${color}"/>`);

  parts.push(`<rect x="${cx - half + 14}" y="${cy - half + 14}" width="${(half - 14) * 2}" height="${(half - 14) * 2}" fill="${color}"/>`);
  parts.push(`<rect x="${cx - half}" y="${cy - half}" width="${half * 2}" height="${half * 2}" fill="none" stroke="${color}" stroke-width="${stroke}"/>`);

  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const horizontal = dx !== 0;
    const reach = horizontal ? cx - 60 : cy - 50;
    for (let i = 0; i < pins; i++) {
      const offset = -half + gap * (i + 1);
      const side = Math.sign(offset) || 1;
      const rank = Math.abs(offset) / half;
      const toward = (a, b) => horizontal ? [cx + dx * a, cy + offset + side * b] : [cx + offset + side * b, cy + dy * a];
      const pinLength = half + 22;
      const knee = pinLength + 24 + (1 - rank) * (horizontal ? 70 : 40);
      const rise = rank * (horizontal ? 130 : 95);
      const end = Math.min(reach, knee + rise + 40 + (i % 2 ? 0 : 55) + rand() * (horizontal ? 120 : 30));
      const pts = [toward(half, 0), toward(pinLength, 0)];
      if (rise > 18) pts.push(toward(knee, 0), toward(knee + rise, rise));
      pts.push(toward(end, pts.length > 2 ? rise : 0));
      line(pts);
      const [ex, ey] = pts[pts.length - 1];
      if (rand() < 0.22 && end > knee + rise + 110) {
        const mid = (knee + rise + end) / 2;
        const [bx, by] = toward(mid, pts.length > 2 ? rise : 0);
        block(bx, by, horizontal ? 54 : 24, horizontal ? 24 : 54);
      }
      pad(ex, ey);
    }
  }
  for (const [x, y, w, h] of [[cx - 250, cy - 300, 70, 38], [cx + 300, cy + 220, 78, 36], [cx + 330, cy - 240, 36, 70], [cx - 235, cy + 290, 64, 34]]) {
    block(x, y, w, h);
    for (let k = -1; k <= 1; k++) {
      const vertical = h > w;
      const [tx, ty] = vertical ? [x + (w / 2 + 8), y + k * h / 4] : [x + k * w / 4, y + (h / 2 + 8)];
      parts.push(`<rect x="${(tx - 5).toFixed(1)}" y="${(ty - 5).toFixed(1)}" width="10" height="10" fill="${color}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join('')}</svg>`;
}
