import * as THREE from 'three';

const SLIDE = 6500;
const FADE = 900;

export function createMovie(sources: string[], caption: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  const images = sources.map((src) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    return image;
  });
  let started = 0, drawn = -Infinity, shown = '';

  function slide(image: HTMLImageElement, progress: number, alpha: number, animate: boolean) {
    const { width, height } = canvas;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * (animate ? 1.12 - progress * 0.08 : 1.04);
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    const pan = animate ? progress : 0.5;
    context.globalAlpha = alpha;
    context.drawImage(image, (width - w) * (0.35 + pan * 0.3), (height - h) * (0.2 + pan * 0.6), w, h);
    context.globalAlpha = 1;
  }

  return {
    texture,
    start(now: number) {
      started = now;
      drawn = -Infinity;
      shown = '';
    },
    draw(now: number, animate: boolean) {
      const ready = images.filter((image) => image.complete && image.naturalWidth > 0);
      const elapsed = now - started;
      const index = Math.floor(elapsed / SLIDE), progress = (elapsed % SLIDE) / SLIDE;
      const fading = animate && ready.length > 1 && elapsed % SLIDE > SLIDE - FADE;
      const key = `${ready.length}:${index}`;
      if (animate ? now - drawn < 40 : key === shown) return;
      drawn = now;
      shown = key;
      const { width, height } = canvas;
      context.fillStyle = '#04050b';
      context.fillRect(0, 0, width, height);
      if (ready.length) {
        slide(ready[index % ready.length], progress, 1, animate);
        if (fading) slide(ready[(index + 1) % ready.length], 0, (elapsed % SLIDE - (SLIDE - FADE)) / FADE, animate);
      }
      const bar = Math.round(height * 0.11);
      context.fillStyle = '#000';
      context.fillRect(0, 0, width, bar);
      context.fillRect(0, height - bar, width, bar);
      context.fillStyle = 'rgba(227,230,255,.82)';
      context.font = '600 15px "JetBrains Mono", monospace';
      context.fillText(`${caption} · ${String((index % Math.max(1, ready.length)) + 1).padStart(2, '0')}/${String(ready.length).padStart(2, '0')}`, 24, height - bar / 2 + 5);
      context.fillStyle = 'rgba(125,151,236,.9)';
      context.fillRect(0, height - 3, width * (animate ? progress : 1), 3);
      texture.needsUpdate = true;
    },
    dispose() {
      texture.dispose();
      images.forEach((image) => { image.src = ''; });
    },
  };
}

export type Movie = ReturnType<typeof createMovie>;
