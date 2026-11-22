import * as THREE from 'three';
import './room-desktop.css';

export type DesktopApp = 'firefox' | 'skydimo' | 'pingloom';
export type LedMode = 'sync' | 'static' | 'off';

type Options = {
  works: string[];
  links: [string, string][];
  base: URL;
  ledMode?: () => LedMode;
  setLedMode?: (mode: LedMode) => void;
};

const APPS: { id: DesktopApp; name: string }[] = [
  { id: 'firefox', name: 'Firefox' },
  { id: 'skydimo', name: 'Skydimo' },
  { id: 'pingloom', name: 'Pingloom' },
];

export function paintWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, '#0a1c4d');
  sky.addColorStop(0.55, '#1d4fb0');
  sky.addColorStop(1, '#8fc0ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const cx = w * 0.56, cy = h * 0.62, r = Math.min(w, h) * 0.42;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const angle = -Math.PI * 0.95 + i * (Math.PI * 0.9 / 8);
    ctx.save();
    ctx.rotate(angle);
    const petal = ctx.createLinearGradient(0, 0, r * 1.25, 0);
    petal.addColorStop(0, 'rgba(120,180,255,0.05)');
    petal.addColorStop(0.55, `rgba(${70 + i * 8},${130 + i * 6},255,0.32)`);
    petal.addColorStop(1, 'rgba(210,235,255,0.55)');
    ctx.fillStyle = petal;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(r * 0.35, -r * 0.34, r * 1.05, -r * 0.3, r * 1.22, 0);
    ctx.bezierCurveTo(r * 1.05, r * 0.3, r * 0.35, r * 0.34, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.5);
  core.addColorStop(0, 'rgba(230,242,255,0.55)');
  core.addColorStop(1, 'rgba(230,242,255,0)');
  ctx.fillStyle = core;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

const WALLPAPER = 'media/desktop/wallpaper.webp';

function drawWallpaper(ctx: CanvasRenderingContext2D, w: number, h: number, base: URL) {
  paintWallpaper(ctx, w, h);
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = new URL(WALLPAPER, base).href;
  });
}

const svg = (body: string, view = '0 0 16 16') => `<svg viewBox="${view}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON = {
  min: svg('<path d="M3 8h10"/>'),
  max: svg('<rect x="3.5" y="3.5" width="9" height="9" rx="1.5"/>'),
  restore: svg('<rect x="3.5" y="5.5" width="7" height="7" rx="1.2"/><path d="M6 3.5h5a1.5 1.5 0 0 1 1.5 1.5v5"/>'),
  close: svg('<path d="M4 4l8 8M12 4l-8 8"/>'),
  search: svg('<circle cx="7" cy="7" r="4.25"/><path d="M10.2 10.2L13.5 13.5"/>'),
  link: svg('<path d="M6.6 9.4l2.8-2.8M7.4 4.6l1-1a2.6 2.6 0 0 1 3.7 3.7l-1 1M8.6 11.4l-1 1a2.6 2.6 0 0 1-3.7-3.7l1-1"/>'),
  mail: svg('<rect x="2.5" y="4" width="11" height="8" rx="1.5"/><path d="M3 5l5 3.8L13 5"/>'),
  wifi: svg('<path d="M2 6.5a9 9 0 0 1 12 0M4.2 8.9a5.8 5.8 0 0 1 7.6 0M6.4 11.2a2.6 2.6 0 0 1 3.2 0"/><circle cx="8" cy="13" r=".6" fill="currentColor"/>'),
  volume: svg('<path d="M2.5 6.2h2.2L8 3.5v9L4.7 9.8H2.5z"/><path d="M10.5 5.8a3 3 0 0 1 0 4.4M12.3 4a5.6 5.6 0 0 1 0 8"/>'),
};

function appIcon(id: DesktopApp, base: URL) {
  if (id === 'pingloom') {
    const img = document.createElement('img');
    img.src = new URL('media/desktop/pingloom.webp', base).href;
    img.alt = '';
    return img;
  }
  const span = document.createElement('span');
  span.innerHTML = id === 'firefox'
    ? '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><radialGradient id="ffa" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffe14d"/><stop offset=".45" stop-color="#ff7139"/><stop offset="1" stop-color="#b833e1"/></radialGradient><radialGradient id="ffb" cx="45%" cy="45%" r="55%"><stop offset="0" stop-color="#6e8bff"/><stop offset="1" stop-color="#2b2a8f"/></radialGradient></defs><circle cx="24" cy="24" r="21" fill="url(#ffa)"/><circle cx="25" cy="25" r="12" fill="url(#ffb)"/><path d="M6 20c3-9 13-15 22-13-6 1-9 4-10 8 4-3 12-2 15 3-6-3-15 0-16 7-1 8 8 13 15 10-6 7-18 6-24-1C5 30 5 24 6 20z" fill="#ff9640"/></svg>'
    : '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d97ec"/><stop offset=".5" stop-color="#3cc8be"/><stop offset="1" stop-color="#9b7dff"/></linearGradient></defs><rect x="3" y="3" width="42" height="42" rx="10" fill="#0e1426"/><rect x="9" y="11" width="30" height="20" rx="2" fill="none" stroke="url(#sky)" stroke-width="3.5"/><rect x="13" y="15" width="22" height="12" rx="1" fill="#1d2a52"/><path d="M20 37h8M24 31v6" stroke="#aab3d6" stroke-width="2.5" stroke-linecap="round"/></svg>';
  return span;
}

export function desktopTexture(base: URL, onReady?: () => void) {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  drawWallpaper(ctx, 1280, 720, base).then(() => {
  ctx.fillStyle = 'rgba(16,22,40,0.72)';
  ctx.fillRect(0, 672, 1280, 48);
  const start = 640 - 2.5 * 44;
  ctx.fillStyle = '#4cc2ff';
  for (const [x, y] of [[0, 0], [11, 0], [0, 11], [11, 11]]) ctx.fillRect(start + 6 + x, 683 + y, 10, 10);
  const clock = new Date();
  ctx.fillStyle = '#e8ebf5';
  ctx.font = '500 15px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 1262, 693);
  ctx.fillText(clock.toLocaleDateString(), 1262, 711);
  ctx.textAlign = 'center';
  let pending = APPS.length;
  APPS.forEach((app, i) => {
    const node = appIcon(app.id, base);
    const svg = node.querySelector('svg');
    const image = new Image();
    image.decoding = 'async';
    image.src = node instanceof HTMLImageElement ? node.src : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg!.outerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"'))}`;
    const done = () => {
      if (image.naturalWidth) {
        ctx.drawImage(image, 34, 26 + i * 104, 56, 56);
        ctx.drawImage(image, start + 54 + i * 44, 680, 30, 30);
      }
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 4;
      ctx.fillText(app.name, 62, 104 + i * 104);
      ctx.shadowBlur = 0;
      texture.needsUpdate = true;
      if (--pending === 0) onReady?.();
    };
    image.onload = done;
    image.onerror = done;
  });
  });
  return texture;
}

export function mountDesktop(root: HTMLElement, opts: Options) {
  const desktop = document.createElement('div');
  desktop.className = 'w11';
  desktop.style.backgroundImage = `url(${new URL(WALLPAPER, opts.base).href})`;

  const icons = document.createElement('div');
  icons.className = 'w11-icons';
  const windows = document.createElement('div');
  windows.className = 'w11-windows';
  const taskbar = document.createElement('div');
  taskbar.className = 'w11-taskbar';
  const startButton = document.createElement('button');
  startButton.type = 'button';
  startButton.className = 'w11-start';
  startButton.setAttribute('aria-label', 'Start');
  startButton.innerHTML = '<i></i><i></i><i></i><i></i>';
  const pinned = document.createElement('div');
  pinned.className = 'w11-pinned';
  pinned.append(startButton);
  const clock = document.createElement('time');
  clock.className = 'w11-clock';
  const tray = document.createElement('div');
  tray.className = 'w11-tray';
  tray.innerHTML = `<span aria-hidden="true">${ICON.wifi}${ICON.volume}</span>`;
  tray.append(clock);
  taskbar.append(pinned, tray);

  const menu = document.createElement('div');
  menu.className = 'w11-menu';
  menu.id = `w11-menu-${Math.random().toString(36).slice(2, 8)}`;
  menu.hidden = true;
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'Start');
  startButton.setAttribute('aria-controls', menu.id);
  startButton.setAttribute('aria-expanded', 'false');
  const search = document.createElement('label');
  search.className = 'w11-search';
  search.innerHTML = ICON.search;
  const query = document.createElement('input');
  query.type = 'search';
  query.placeholder = 'Search apps and links';
  query.setAttribute('aria-label', 'Search apps and links');
  search.append(query);
  const pinnedTitle = document.createElement('h5');
  pinnedTitle.textContent = 'Pinned';
  const grid = document.createElement('div');
  grid.className = 'w11-grid';
  const recTitle = document.createElement('h5');
  recTitle.textContent = 'Recommended';
  const recs = document.createElement('div');
  recs.className = 'w11-recs';
  for (const [text, href] of opts.links) {
    const link = document.createElement('a');
    link.href = href;
    link.dataset.name = text.toLowerCase();
    if (!href.startsWith('mailto:')) { link.target = '_blank'; link.rel = 'noopener'; }
    const meta = document.createElement('span');
    const sub = document.createElement('small');
    sub.textContent = href.startsWith('mailto:') ? href.slice(7) : new URL(href).hostname.replace(/^www\./, '');
    meta.append(text, sub);
    link.insertAdjacentHTML('afterbegin', href.startsWith('mailto:') ? ICON.mail : ICON.link);
    link.append(meta);
    recs.append(link);
  }
  const empty = document.createElement('p');
  empty.className = 'w11-empty';
  empty.hidden = true;
  const foot = document.createElement('footer');
  const user = document.createElement('span');
  const avatar = document.createElement('img');
  avatar.src = new URL('media/avatar.webp', opts.base).href;
  avatar.alt = '';
  user.append(avatar, 'zhugez');
  foot.append(user);
  menu.append(search, pinnedTitle, grid, recTitle, recs, empty, foot);

  const setMenu = (show: boolean) => {
    if (menu.hidden !== show) return;
    menu.hidden = !show;
    startButton.setAttribute('aria-expanded', String(show));
    startButton.classList.toggle('on', show);
    if (show) query.focus({ preventScroll: true });
    else { query.value = ''; filter(); }
  };
  const filter = () => {
    const q = query.value.trim().toLowerCase();
    let shown = 0;
    for (const item of menu.querySelectorAll<HTMLElement>('[data-name]')) {
      item.hidden = !!q && !item.dataset.name!.includes(q);
      if (!item.hidden) shown++;
    }
    pinnedTitle.hidden = recTitle.hidden = !!q;
    empty.hidden = shown > 0;
    empty.textContent = `Nothing matches “${query.value.trim()}”`;
  };
  query.addEventListener('input', filter);
  query.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    menu.querySelector<HTMLElement>('[data-name]:not([hidden])')?.click();
  });
  startButton.addEventListener('click', () => setMenu(menu.hidden === true));
  recs.addEventListener('click', () => setMenu(false));
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !menu.hidden) { setMenu(false); startButton.focus({ preventScroll: true }); }
  };
  window.addEventListener('keydown', onKey);
  desktop.addEventListener('pointerdown', (event) => {
    const node = event.target as Node;
    if (!menu.hidden && !menu.contains(node) && !startButton.contains(node)) setMenu(false);
  });

  const open = new Map<DesktopApp, HTMLElement>();
  const tasks = new Map<DesktopApp, HTMLButtonElement>();
  let z = 1;

  const front = (win: HTMLElement) => {
    win.hidden = false;
    win.style.zIndex = String(++z);
    for (const [id, other] of open) {
      other.classList.toggle('active', other === win);
      tasks.get(id)?.classList.toggle('active', other === win);
    }
  };
  const close = (id: DesktopApp) => {
    open.get(id)?.remove();
    open.delete(id);
    tasks.get(id)?.classList.remove('on', 'active');
  };
  const minimize = (id: DesktopApp) => {
    const win = open.get(id);
    if (!win) return;
    win.hidden = true;
    win.classList.remove('active');
    tasks.get(id)?.classList.remove('active');
  };

  function content(id: DesktopApp) {
    const body = document.createElement('div');
    body.className = `w11-body w11-${id}`;
    if (id === 'firefox') {
      const bar = document.createElement('div');
      bar.className = 'w11-url';
      bar.textContent = 'lyngocvu.tech';
      const page = document.createElement('div');
      page.className = 'w11-page';
      const title = document.createElement('h4');
      title.textContent = 'Artworks';
      const art = document.createElement('div');
      art.className = 'w11-art';
      opts.works.forEach((src, i) => {
        const image = document.createElement('img');
        image.src = src;
        image.alt = `Artwork ${i + 1}`;
        image.decoding = 'async';
        art.append(image);
      });
      const linksTitle = document.createElement('h4');
      linksTitle.textContent = 'Links';
      const list = document.createElement('ul');
      for (const [text, href] of opts.links) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = text;
        if (!href.startsWith('mailto:')) { link.target = '_blank'; link.rel = 'noopener'; }
        const item = document.createElement('li');
        item.append(link);
        list.append(item);
      }
      page.append(title, art, linksTitle, list);
      body.append(bar, page);
    } else if (id === 'skydimo') {
      const label = document.createElement('p');
      label.textContent = 'Monitor backlight · 23 zones · synced with the hex wall';
      const row = document.createElement('div');
      row.className = 'w11-modes';
      const render = () => {
        const current = opts.ledMode?.() ?? 'sync';
        row.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === current)));
      };
      for (const [mode, text] of [['sync', 'Sync to music'], ['static', 'Static'], ['off', 'Off']] as [LedMode, string][]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.mode = mode;
        button.textContent = text;
        button.addEventListener('click', () => { opts.setLedMode?.(mode); render(); });
        row.append(button);
      }
      render();
      body.append(label, row);
    } else {
      const logo = document.createElement('img');
      logo.src = new URL('media/desktop/pingloom.webp', opts.base).href;
      logo.alt = '';
      const tagline = document.createElement('strong');
      tagline.textContent = 'Eight directions. One flick.';
      const text = document.createElement('p');
      text.textContent = 'Native desktop pings and animated emotes, independent of the game client.';
      const links = document.createElement('p');
      for (const [label, href] of [['Website & demo', 'https://pingloom.lyngocvu.tech/'], ['GitHub', 'https://github.com/zhugez/pingloom']]) {
        const a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = label;
        links.append(a);
      }
      body.append(logo, tagline, text, links);
    }
    return body;
  }

  function launch(id: DesktopApp) {
    setMenu(false);
    const existing = open.get(id);
    if (existing) { front(existing); return; }
    const app = APPS.find((a) => a.id === id)!;
    const win = document.createElement('section');
    win.className = 'w11-window';
    win.setAttribute('aria-label', app.name);
    const head = document.createElement('header');
    const name = document.createElement('span');
    name.append(appIcon(id, opts.base), app.name);
    const controls = document.createElement('div');
    const control = (label: string, icon: string, action: () => void) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `${label} ${app.name}`);
      button.innerHTML = icon;
      button.addEventListener('click', action);
      controls.append(button);
      return button;
    };
    control('Minimize', ICON.min, () => minimize(id));
    const max = control('Maximize', ICON.max, () => {
      const on = win.classList.toggle('max');
      max.setAttribute('aria-label', `${on ? 'Restore' : 'Maximize'} ${app.name}`);
      max.innerHTML = on ? ICON.restore : ICON.max;
    });
    const shut = control('Close', ICON.close, () => close(id));
    shut.className = 'w11-close';
    head.append(name, controls);
    head.addEventListener('dblclick', (event) => { if (!controls.contains(event.target as Node)) max.click(); });
    win.append(head, content(id));
    win.addEventListener('pointerdown', () => front(win));
    windows.append(win);
    open.set(id, win);
    tasks.get(id)?.classList.add('on');
    front(win);
    shut.focus({ preventScroll: true });
    root.dataset.desktopApp = id;
  }

  for (const app of APPS) {
    const icon = document.createElement('button');
    icon.type = 'button';
    icon.className = 'w11-icon';
    icon.dataset.app = app.id;
    icon.append(appIcon(app.id, opts.base), app.name);
    icon.addEventListener('dblclick', () => launch(app.id));
    icon.addEventListener('click', (event) => { if ((event as PointerEvent).pointerType !== 'mouse') launch(app.id); });
    icon.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); launch(app.id); } });
    icons.append(icon);
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.dataset.name = app.name.toLowerCase();
    tile.append(appIcon(app.id, opts.base), app.name);
    tile.addEventListener('click', () => launch(app.id));
    grid.append(tile);
    const task = document.createElement('button');
    task.type = 'button';
    task.className = 'w11-task';
    task.setAttribute('aria-label', app.name);
    task.append(appIcon(app.id, opts.base));
    task.addEventListener('click', () => {
      const win = open.get(app.id);
      if (win?.classList.contains('active')) minimize(app.id);
      else launch(app.id);
    });
    pinned.append(task);
    tasks.set(app.id, task);
  }

  const tick = () => {
    const now = new Date();
    clock.innerHTML = '';
    clock.append(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), document.createElement('br'), now.toLocaleDateString());
  };
  tick();
  const timer = window.setInterval(tick, 30000);

  desktop.append(icons, windows, menu, taskbar);
  root.replaceChildren(desktop);
  root.classList.add('room-screen-w11');
  return {
    launch,
    dispose() {
      clearInterval(timer);
      window.removeEventListener('keydown', onKey);
      desktop.remove();
      root.classList.remove('room-screen-w11');
    },
  };
}
