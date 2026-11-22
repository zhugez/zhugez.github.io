import { mountAurora } from './aurora';
import type { VinylState } from './room-feature';

const GEAR = [
  { ic: '🖱️', name: 'ATK Blazing Sky X1 Ultimate', desc: 'Wireless mouse · PAW3950 8K', variation: 'X1 Ultimate · White', img: '', url: 'https://shopee.vn/-S%E1%BA%B4N-GIAO-Chu%E1%BB%99t-kh%C3%B4ng-d%C3%A2y-ATK-Blazing-Sky-X1-Ultra-X1-Promax-X1-Pro-X1-SE-PAW3950-8K-(T%E1%BA%B7ng-k%C3%A8m-dongle-8K)-i.113486214.27651954149' },
  { ic: '⌨️', name: 'ATK ACE68 Air', desc: 'Mechanical keyboard', variation: 'White', img: '', url: '' },
  { ic: '🎧', name: 'EPZ TP35 PRO', desc: 'Portable DAC/AMP · CS43198 ×2 · mic support', variation: 'Silver', img: '', url: '' },
  { ic: '🖊️', name: 'XPPen Deco 01 V3', desc: 'Graphics tablet · 16K pen · Android', variation: 'Black', img: '', url: '' },
  { ic: '⌨️', name: 'NJ81', desc: 'Mechanical keyboard', variation: '', img: '', url: '' },
  { ic: '🎧', name: 'Audio-Technica ATH-M50x', desc: 'Studio headphones', variation: '', img: 'https://static.wixstatic.com/media/d8450b_6f5a6b50487d4aafba73476993eee1b6~mv2.jpg/v1/fit/w_500,h_500,q_90/file.jpg', url: 'https://www.thaisonbeatbox.com/product-page/audio-technica-ath-m50x' },
  { ic: '🎚️', name: 'Arturia MiniFuse 2', desc: 'USB-C audio interface', variation: 'White', img: 'https://static.wixstatic.com/media/d8450b_46909e77d5f648d393030c66056ce4e6~mv2.jpeg/v1/fit/w_500,h_500,q_90/file.jpg', url: 'https://www.thaisonbeatbox.com/product-page/arturia-minifuse-2-white' },
  { ic: '📷', name: 'OBSBOT Meet 2', desc: 'AI tracking webcam', variation: 'White', img: '', url: '' },
  { ic: '🎙️', name: 'Razer Seiren V3 Chroma', desc: 'USB stream mic · RGB', variation: 'White', img: 'https://bizweb.dktcdn.net/thumb/grande/100/329/122/products/aeimageframe-34806908-7467710e-eed0-4a43-8a79-1dccee71d90a.png?v=1767322747487', url: 'https://memoryzone.com.vn/thiet-bi-stream-microphone-razer-seiren-v3-chroma?variantid=117442208' },
  { ic: '🎹', name: 'Arturia KeyLab Essential 88 mk3', desc: 'MIDI controller · 88 keys', variation: 'White', img: '', url: 'https://nhaccutienmanh.vn/arturia-keylab-essential-88-mk3-midi-controller/' },
  { ic: '🖥️', name: 'LG 24GS60F-B', desc: 'Gaming monitor · 24" IPS · FHD · 180Hz', variation: 'Black', img: '', url: 'https://www.lg.com/us/monitors/lg-24gs60f-b-gaming-monitor' },
  { ic: '🔊', name: 'Ortizan C7', desc: 'Studio monitor speakers', variation: 'White', img: '', url: '' }
];

export const MAKE = [
  ['Interfaces', 'Product UI, portfolios and small web apps that feel quick in the hand and calm to the eye.', 'design · web · motion'],
  ['Software', 'Front to back: Astro, Preact, TypeScript, Python. Built lean, shipped often, measured after.', 'dev · tooling · perf'],
  ['Sound', 'A MIDI controller, a pair of monitors and a record player. Put an Adele · 30 LP on the deck to play it.', 'music · audio · sfx'],
  ['Research', 'Tiny AI models and security work: training, testing, and taking things apart to see how they fail.', 'ai · cyber · lab']
];
export const STEPS = [
  ['i', 'Listen', 'Start with the people and the problem. Write down what “done” feels like before drawing anything.'],
  ['ii', 'Sketch', 'Rough frames, rough loops. Cheap to throw away, so I throw a lot away.'],
  ['iii', 'Build', 'Real code early. The browser is the sketchbook that tells the truth.'],
  ['iv', 'Tune', 'Shave the frames, fix the contrast, check it on a bad phone. Then once more.']
];


export const createProfileState = () => ({ modalIndex: null as number | null, theme: 'dark', hue: 226, panelOpen: false, gearOpen: false, typed: '', paletteOpen: false, paletteQuery: '', paletteIdx: 0, boot: 0, say: 'hi! ✦', poke: 0, zone: -1, musicOpen: false, vinyl: null as VinylState | null, mounted: false });
export type ProfileState = ReturnType<typeof createProfileState>;
export type ProfileProps = { artistName?: string; handle?: string; statusText?: string; aboutText?: string };
declare global { interface Window { ARISE_WORKS: string[]; } }

export class ProfileRuntime {
  constructor(public state: ProfileState, private getProps: () => ProfileProps) {}
  get props() { return this.getProps(); }
  setState(update: Partial<ProfileState> | ((state: ProfileState) => Partial<ProfileState>)) {
    Object.assign(this.state, typeof update === 'function' ? update(this.state) : update);
  }
  // ---- mutable instance refs / runtime handles ----
  _root: any; _page: any; _curDot: any; _curRing: any;
  _disposed = false; _abort = new AbortController(); _greet: (() => void) | undefined; _mascotIdle = 0; _mascotTimer: ReturnType<typeof setTimeout> | undefined;
  _sfx: any; _loading = true;
  _paletteInput: any; _gearClose: any; _lastFocus: any;
  _fine = false; _rm = false; _lyricWords: HTMLElement[] = []; _lyricKey = ''; _lyricHidden = false; _room: any;
  _float: HTMLElement[] = []; _fi = 0; _sung = 0; _roomIO: any; _aurora: any;
  _tx = 0; _ty = 0; _crx = 0; _cry = 0;
  _typeT: any; _loadT: any; _sfxStop: any;
  _bootT: any; _mascot: any; _mascotEl: any; _mascotLoading = false; _ghT: any; _raf: any; _pRaf: any;
  _tiltT: any; _onMove: any; _onKey: any; _onOver: any; _onDown: any;
  _pResize: any;

  _startTyping() {
    const phrases = [
      this.props.statusText ?? 'designing · building · producing',
      'making beats at 2am ☕',
      'shipping web apps ✦',
      'training tiny AI models',
      'breaking & securing things 🛡️'
    ];
    let pi = 0, ci = 0, deleting = false;
    const step = () => {
      const full = phrases[pi];
      if (!deleting) {
        ci++;
        this.setState({ typed: full.slice(0, ci) });
        if (ci >= full.length) { deleting = true; this._typeT = setTimeout(step, 1600); return; }
        this._typeT = setTimeout(step, 75 + Math.random() * 55);
      } else {
        ci--;
        this.setState({ typed: full.slice(0, ci) });
        if (ci <= 0) { deleting = false; pi = (pi + 1) % phrases.length; this._typeT = setTimeout(step, 350); return; }
        this._typeT = setTimeout(step, 38);
      }
    };
    step();
  }
  mount() {
    this.setState({ mounted: true });
    try { this.setState({ musicOpen: localStorage.getItem('zhugez.music.open') === '1' }); } catch {}
    // custom cursor follow
    this._tx = window.innerWidth / 2; this._ty = window.innerHeight / 2; this._crx = this._tx; this._cry = this._ty;
    this._onMove = (e: any) => { this._tx = e.clientX; this._ty = e.clientY; };
    window.addEventListener('mousemove', this._onMove, { passive: true });
    // capability / motion preference
    this._fine = !!(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches);
    this._rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches);
    if (this._fine && !this._rm) document.documentElement.classList.add('dc-cursor-on');
    this._onOver = (e: any) => { if (!this._curRing || !e.target || !e.target.closest) return; this._curRing.classList.toggle('hot', !!e.target.closest('a,button,input,.work-cell')); };
    window.addEventListener('pointerover', this._onOver, { passive: true });
    // style-hover wiring (the DC runtime used to provide this)
    if (this._fine && !this._rm) this._wireHover();
    // 3D tilt on cards (after entrance settles)
    if (this._fine && !this._rm) {
      this._tiltT = setTimeout(() => {
        if (!this._root) return;
        this._root.querySelectorAll('.grid').forEach((c: any) => { c.style.perspective = '1000px'; });
        this._root.querySelectorAll('.card').forEach((card: any) => {
          card.classList.add('tilt');
          // glare sheen overlay (Apple-style)
          if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
          const glare = document.createElement('div');
          glare.style.cssText = 'position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .3s ease;mix-blend-mode:screen;z-index:4;background:radial-gradient(circle 180px at 50% 0%,rgba(255,255,255,.16),transparent 60%);';
          card.appendChild(glare);
          card.addEventListener('pointermove', (e: any) => { const r = card.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5; card.style.transform = 'rotateX(' + (-py * 4.5).toFixed(2) + 'deg) rotateY(' + (px * 5.5).toFixed(2) + 'deg)'; glare.style.opacity = '1'; glare.style.background = 'radial-gradient(circle 200px at ' + (e.clientX - r.left) + 'px ' + (e.clientY - r.top) + 'px,rgba(255,255,255,.16),transparent 55%)'; });
          card.addEventListener('pointerleave', () => { card.style.transform = 'rotateX(0deg) rotateY(0deg)'; glare.style.opacity = '0'; });
        });
        // magnetic buttons (composes via the `translate` property, independent of transform)
        document.querySelectorAll('.mag').forEach((el: any) => {
          el.addEventListener('pointermove', (e: any) => { const r = el.getBoundingClientRect(); const dx = (e.clientX - (r.left + r.width / 2)) * 0.3, dy = (e.clientY - (r.top + r.height / 2)) * 0.3; el.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px'; });
          el.addEventListener('pointerleave', () => { el.style.translate = '0px 0px'; });
        });
      }, 1400);
      // click ripple on any button
      this._onDown = (e: any) => {
        const b = e.target && e.target.closest && e.target.closest('button');
        if (!b) return;
        const r = b.getBoundingClientRect(); const d = Math.max(r.width, r.height) * 1.25;
        if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
        const rip = document.createElement('span');
        rip.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;z-index:5;width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px;background:radial-gradient(circle,rgba(255,255,255,.5),transparent 70%);transform:scale(0);opacity:.7;';
        b.appendChild(rip);
        requestAnimationFrame(() => { rip.style.transition = 'transform .5s ease-out,opacity .55s ease-out'; rip.style.transform = 'scale(1)'; rip.style.opacity = '0'; });
        setTimeout(() => { if (rip.parentNode) rip.parentNode.removeChild(rip); }, 580);
      };
      window.addEventListener('pointerdown', this._onDown, true);
    }
    this._onKey = (e: any) => {
      const k = e.key;
      if ((e.metaKey || e.ctrlKey) && (k === 'k' || k === 'K')) { e.preventDefault(); if (this.state.paletteOpen) this._closePalette(); else this._openPalette(); return; }
      if (this.state.paletteOpen) {
        const list = this._filtered();
        if (k === 'Escape') { e.preventDefault(); this._closePalette(); return; }
        if (k === 'ArrowDown') { e.preventDefault(); this.setState((s: any) => ({ paletteIdx: Math.min((s.paletteIdx || 0) + 1, Math.max(0, list.length - 1)) })); return; }
        if (k === 'ArrowUp') { e.preventDefault(); this.setState((s: any) => ({ paletteIdx: Math.max((s.paletteIdx || 0) - 1, 0) })); return; }
        if (k === 'Enter') { e.preventDefault(); const c = list[this.state.paletteIdx || 0]; if (c && c.run) c.run(); return; }
        return;
      }
      if (k !== 'Escape') return;
      if (this.state.gearOpen) { document.body.classList.remove('dc-modal-lock'); this.setState({ gearOpen: false }); if (this._lastFocus && this._lastFocus.focus) this._lastFocus.focus(); } else if (this.state.modalIndex != null) { this.setState({ modalIndex: null }); }
    };
    window.addEventListener('keydown', this._onKey);
    const loop = () => {
      if (this._curDot) this._curDot.style.transform = 'translate(' + this._tx + 'px,' + this._ty + 'px) translate(-50%,-50%)';
      this._crx += (this._tx - this._crx) * 0.25; this._cry += (this._ty - this._cry) * 0.25;
      if (this._curRing) this._curRing.style.transform = 'translate(' + this._crx + 'px,' + this._cry + 'px) translate(-50%,-50%)';
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
    this._startTyping();
    this._startLoader();
    this._ghT = setTimeout(() => this._fetchGitHub(), 2600);
  }
  _wireHover() {
    document.querySelectorAll('[data-style-hover]').forEach((el: any) => {
      if (el._hoverBound) return; el._hoverBound = true;
      const hover = el.getAttribute('data-style-hover') || '';
      el.addEventListener('pointerenter', () => { el._baseStyle = el.getAttribute('style') || ''; el.style.cssText = el._baseStyle + ';' + hover; });
      el.addEventListener('pointerleave', () => { el.style.cssText = el._baseStyle || ''; });
    });
  }
  _playSfx() {
    const sfx = this._sfx; if (!sfx) return Promise.resolve();
    try {
      sfx.volume = 0.7; sfx.currentTime = 0; const pr = sfx.play();
      clearTimeout(this._sfxStop); this._sfxStop = setTimeout(() => { try { sfx.pause(); } catch (e) {} }, 2000);
      return pr || Promise.resolve();
    } catch (e) { return Promise.reject(e); }
  }
  _startLoader() {
    // play the konichiwa sfx; if autoplay is blocked, play on the first interaction
    this._playSfx().catch(() => {
      const h = () => { this._playSfx().catch(() => {}); window.removeEventListener('pointerdown', h); window.removeEventListener('keydown', h); };
      if (this._disposed) return;
      this._greet = h;
      window.addEventListener('pointerdown', h, { once: true }); window.addEventListener('keydown', h, { once: true });
    });
    // wordmark and mascot greet at centre, then fly home into the hero while the overlay fades.
    // performance.now() counts from navigation start, so a slow load adds no extra wait.
    // No hold under reduced motion, or when a reload restored the scroll below the hero.
    const hold = (this._rm || window.scrollY > 80) ? 0 : Math.max(300, 1500 - performance.now());
    this._loadT = setTimeout(() => {
      this._loading = false;
      this.setState({ boot: 1 });
      this._bootT = setTimeout(() => {
        this.setState({ boot: 2 });
        const idle = (window as any).requestIdleCallback as ((cb: () => void, o: { timeout: number }) => number) | undefined;
        if (idle) this._mascotIdle = idle(this._loadMascot, { timeout: 2500 }); else this._mascotTimer = setTimeout(this._loadMascot, 600);
      }, 1000);
    }, hold);
  }
  // ---- ⌘K command palette ----
  _commands() {
    const go = (id: string) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); this._closePalette(); };
    return [
      { id: 'theme', label: 'Toggle theme', hint: this.state.theme === 'dark' ? '→ light' : '→ dark', icon: '◐', run: () => { this.setState((s: any) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })); this._closePalette(); } },
      ...(this.state.vinyl ? [{ id: 'music', label: this.state.vinyl.playing ? 'Pause music' : 'Play music', hint: 'now playing', icon: this.state.vinyl.playing ? '❚❚' : '▶', run: () => { this.onPlayer(); this._closePalette(); } }] : []),
      { id: 'copy', label: 'Copy handle', hint: this.props.handle ?? '@zhugez', icon: '⧉', run: () => { try { navigator.clipboard && navigator.clipboard.writeText(this.props.handle ?? '@zhugez'); } catch (e) {} this._closePalette(); } },
      { id: 'gear', label: 'Tech stack & setup', hint: 'gear', icon: '🛠', run: () => { this._closePalette(); this._lastFocus = document.activeElement; document.body.classList.add('dc-modal-lock'); this.setState({ gearOpen: true }); setTimeout(() => { if (this._gearClose) this._gearClose.focus(); }, 60); } },
      { id: 'accent', label: 'Accent & theme panel', hint: 'settings', icon: '✦', run: () => { this.setState((s: any) => ({ panelOpen: !s.panelOpen })); this._closePalette(); } },
      { id: 'github', label: 'Open GitHub', hint: '@zhugez', icon: '↗', run: () => { window.open('https://github.com/zhugez', '_blank', 'noopener'); this._closePalette(); } },
      { id: 'go-about', label: 'Go to · About', hint: 'section', icon: '§', run: () => go('sec-about') },
      { id: 'go-socials', label: 'Go to · Socials', hint: 'section', icon: '§', run: () => go('sec-socials') },
      { id: 'go-tech', label: 'Go to · Zhuge in Tech', hint: 'section', icon: '§', run: () => go('sec-tech') },
      { id: 'go-music', label: 'Go to · Studio', hint: 'section', icon: '§', run: () => go('sec-music') },
      { id: 'go-works', label: 'Go to · Artworks', hint: 'section', icon: '§', run: () => go('sec-works') },
      { id: 'go-links', label: 'Go to · Links', hint: 'section', icon: '§', run: () => go('sec-links') }
    ];
  }
  _filtered() { const q = (this.state.paletteQuery || '').toLowerCase().trim(); const all = this._commands(); if (!q) return all; return all.filter((c) => (c.label + ' ' + c.hint).toLowerCase().indexOf(q) >= 0); }
  _openPalette() { this.setState({ paletteOpen: true, paletteQuery: '', paletteIdx: 0 }); setTimeout(() => { if (this._paletteInput) { this._paletteInput.value = ''; this._paletteInput.focus(); } }, 40); }
  _closePalette() { this.setState({ paletteOpen: false }); }
  // ---- live GitHub data ----
  _animCount(el: any, end: number) { if (el) el.textContent = String(end); }
  _fetchGitHub() {
    if (typeof fetch !== 'function') return;
    const set = (k: string, v: number) => { const el = document.querySelector('[data-gh="' + k + '"]'); if (el) { el.setAttribute('data-count', String(v)); this._animCount(el, v); } };
    fetch('https://api.github.com/users/zhugez', { signal: this._abort.signal }).then((r) => r.ok ? r.json() : null).then((u) => {
      if (!u) return;
      if (typeof u.public_repos === 'number') set('repos', u.public_repos);
      if (typeof u.followers === 'number') set('followers', u.followers);
    }).catch(() => {});
    fetch('https://api.github.com/users/zhugez/repos?per_page=100&sort=updated', { signal: this._abort.signal }).then((r) => r.ok ? r.json() : null).then((rs) => {
      if (!Array.isArray(rs)) return;
      const stars = rs.reduce((a, b) => a + ((b && b.stargazers_count) || 0), 0);
      set('stars', stars);
    }).catch(() => {});
  }
  dispose() { this._disposed = true; this._abort.abort(); this._clearLyrics(); this._sfx?.pause(); clearTimeout(this._mascotTimer); if (this._mascotIdle) window.cancelIdleCallback?.(this._mascotIdle); if (this._greet) { window.removeEventListener('pointerdown', this._greet); window.removeEventListener('keydown', this._greet); } if (this._aurora) this._aurora(); if (this._roomIO) this._roomIO.disconnect(); if (this._room) this._room.dispose(); if (this._mascot) this._mascot.dispose(); clearTimeout(this._typeT); clearTimeout(this._loadT); clearTimeout(this._sfxStop); clearTimeout(this._bootT); cancelAnimationFrame(this._raf); cancelAnimationFrame(this._pRaf); window.removeEventListener('mousemove', this._onMove); window.removeEventListener('keydown', this._onKey); window.removeEventListener('pointerover', this._onOver); clearTimeout(this._tiltT); clearTimeout(this._ghT); if (this._onDown) window.removeEventListener('pointerdown', this._onDown, true); document.documentElement.classList.remove('dc-cursor-on'); document.body.classList.remove('dc-modal-lock'); if (this._pResize) window.removeEventListener('resize', this._pResize); }
  fmt(s: number) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60), x = Math.floor(s % 60); return m + ':' + String(x).padStart(2, '0'); }
  floatRef = (el: HTMLElement | null) => {
    if (!el || this._float.length) return;
    this._float = Array.from({ length: 8 }, () => el.appendChild(document.createElement('span')));
    el.addEventListener('animationend', (e) => { if ((e.target as HTMLElement).parentElement === el) (e.target as HTMLElement).classList.remove('on'); });
  };
  _floatLyric(words: string[], key: string, times: number[] = [], at = 0, lineEnd = 0) {
    const s = this.state;
    this._clearLyrics();
    this._lyricKey = key;
    this._lyricHidden = document.hidden || s.modalIndex != null || s.gearOpen || s.paletteOpen;
    if (this._lyricHidden || !words.length) return;
    // ponytail: three chunks at most, each a third of the line
    const size = words.length <= 6 ? words.length : Math.ceil(words.length / 3);
    for (let c = 0; c < 3 && c * size < words.length; c++) {
      const chunk = words.slice(c * size, c * size + size);
      const n = this._float[this._fi++ % this._float.length];
      if (!n) break;
      n.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      n.classList.remove('on');
      void n.offsetWidth;
      n.replaceChildren(...chunk.flatMap((word, i) => {
        const b = document.createElement('b');
        b.textContent = word;
        b.style.setProperty('--word-delay', i * 22 + 'ms');
        this._lyricWords.push(b);
        return i ? [' ', b] : [b];
      }));
      const lane = (this._fi + c) % 3;
      const start = Math.max(0, ((times[c * size] ?? at + c * 0.3) - at) * 1000);
      const end = times[(c + 1) * size] ?? lineEnd;
      const duration = Math.max(2000 + chunk.length * 110, (end - at) * 1000 - start);
      const id = key + ':' + this._fi;
      n.dataset.lyricId = id;
      n.dataset.lyricKey = key;
      n.dataset.lyricChunk = String(c);
      n.className = 'lyric on' + (this._rm ? ' still' : '');
      n.style.cssText = `--x:${16 + lane * 26}px;--dx:-18px;--rise:20vh;--base:${14 + lane * 7}vh;--start:${start}ms;--o:.98;--d:${duration}ms;--c:var(--accent)`;
      if (this._rm) window.setTimeout(() => { if (n.dataset.lyricId === id) n.classList.remove('on'); }, start + duration);
    }
    this._sung = 0;
  }
  _clearLyrics() {
    this._float.forEach((line) => {
      if (!line.classList.contains('lyric')) return;
      line.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
      line.classList.remove('on');
    });
    this._lyricWords = [];
    this._lyricKey = '';
    this._lyricHidden = false;
  }
  _sing(sung: number) {
    const words = this._lyricWords;
    if (!words.length) return;
    words.forEach((word, i) => word.classList.toggle('sung', i < sung));
    if (sung < this._sung) words.forEach((word) => { word.getAnimations().forEach((animation) => animation.cancel()); word.style.removeProperty('transform'); word.style.removeProperty('text-shadow'); });
    if (sung > this._sung) {
      const active = words[Math.min(sung, words.length) - 1];
      if (active && !this._rm) active.animate([
        { transform: 'translateY(5px) scale(.88)', textShadow: '0 0 0 transparent' },
        { transform: 'translateY(-4px) scale(1.16)', textShadow: '0 0 22px var(--accent)' },
        { transform: 'translateY(0) scale(1)', textShadow: '0 0 12px var(--accent)' },
      ], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
      else if (active) { active.style.transform = 'none'; active.style.textShadow = '0 0 12px var(--accent)'; }
    }
    this._sung = sung;
  }
  auroraRef = (el: any) => { if (el && !this._aurora) this._aurora = mountAurora(el, () => this.state.hue, () => [this._tx || 0, this._ty || 0]); };
  roomRef = (el: any) => {
    if (!el || this._roomIO || !('IntersectionObserver' in window)) return;
    this._roomIO = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      this._roomIO.disconnect();
      import('./room').then((m) => {
        if (this._disposed || !el.isConnected) return;
        this._room = m.mountRoom(el, {
          get: () => ({ active: this.state.zone }),
          onHover: (z) => this.setState({ zone: z }),
                    onVinyl: (vinyl) => {
            if (vinyl?.line && (vinyl.lyricKey !== this._lyricKey || (vinyl.sung ?? 0) < this._sung)) this._floatLyric(vinyl.words ?? [], vinyl.lyricKey ?? '', vinyl.wordTimes ?? [], vinyl.lyricAt ?? 0, vinyl.lineEnd ?? 0);
            if (!vinyl?.line) this._clearLyrics();
            this._sing(vinyl?.line && !this._lyricHidden ? vinyl.sung ?? 0 : 0);
            this.setState({ vinyl });
          },
          art: (window.ARISE_WORKS || [])[0],
          gear: GEAR.map((g) => g.name),
          details: Object.fromEntries(GEAR.map((g) => [g.name, g.desc])),
          works: window.ARISE_WORKS || [],
          links: [...document.querySelectorAll<HTMLAnchorElement>('#sec-tech a, #sec-socials a, #sec-links a')].filter((a) => /^(https?|mailto):/.test(a.getAttribute('href') || '')).map((a) => [[...a.querySelectorAll('div, span')].map((e) => e.childElementCount ? '' : e.textContent.trim()).find(Boolean) || a.href, a.href] as [string, string])
        });
      }).catch(() => el.classList.add('room-off'));
    }, { rootMargin: '600px' });
    this._roomIO.observe(el);
  };
  _makeSprite(rgb: string) {
    const s = 64, cv = document.createElement('canvas'); cv.width = cv.height = s;
    const c = cv.getContext('2d')!;
    const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(' + rgb + ',1)');
    g.addColorStop(0.25, 'rgba(' + rgb + ',0.55)');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    return cv;
  }
  _initParticles(canvas: any) {
    // fireflies over the scene. Skipped under reduced motion (queried here: this ref runs before componentDidMount sets _rm)
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, flies: any[] = [];
    const sprites = ['255,214,130', '255,238,176', '176,240,206'].map((c) => this._makeSprite(c));
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W; canvas.height = H; // ponytail: 1x backing store, soft glows do not need devicePixelRatio
      flies = Array.from({ length: Math.round(W * H / 42000) }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(4, 11), vy: -rnd(0.04, 0.2), sway: rnd(0.3, 0.9), ph: rnd(0, 6.28), tw: rnd(0.008, 0.025), a: rnd(0.3, 0.8), ci: (Math.random() * sprites.length) | 0 }));
    };
    resize();
    this._pResize = resize; window.addEventListener('resize', resize);
    const draw = () => {
      this._pRaf = requestAnimationFrame(draw);
      if (this._loading) return; // idle behind the intro overlay
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of flies) {
        p.y += p.vy; p.ph += p.tw; p.x += Math.sin(p.ph) * p.sway * 0.2;
        if (p.y < -p.r) { p.y = H + p.r; p.x = rnd(0, W); }
        ctx.globalAlpha = p.a * (0.5 + 0.5 * Math.sin(p.ph * 2.3));
        ctx.drawImage(sprites[p.ci], p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    };
    draw();
  }
  // ---- theme application (runs at mount via ref and on every render) ----
  _applyTheme(el: any) {
    if (!el) return;
    const hue = this.state.hue, h2 = (hue + 28) % 360;
    const lt = this.state.theme === 'light'; // light surfaces need a dark accent to stay readable
    const c = 'hsl(' + hue + (lt ? ' 62% 30%)' : ' 72% 68%)'), c2 = 'hsl(' + h2 + (lt ? ' 70% 34%)' : ' 80% 70%)');
    const soft = 'hsla(' + hue + ',72%,68%,.18)';
    el.setAttribute('data-theme', this.state.theme);
    el.style.setProperty('--accent', c);
    el.style.setProperty('--accent2', c2);
    el.style.setProperty('--accent-soft', soft);
    el.style.setProperty('--accent-ring', 'hsla(' + hue + ',72%,68%,.35)');
  }

  // ---- stable refs & handlers (defined once) ----
  pageRef = (el: any) => { this._page = el; this._applyTheme(el); };
  sfxRef = (el: any) => { this._sfx = el; };
  curDotRef = (el: any) => { this._curDot = el; };
  curRingRef = (el: any) => { this._curRing = el; };
  rootRef = (el: any) => { this._root = el; };
  particleRef = (el: any) => { if (el && !el._init) { el._init = true; this._initParticles(el); } };
  paletteInputRef = (el: any) => { this._paletteInput = el; };
  gearCloseRef = (el: any) => { this._gearClose = el; };
  imgSrcRef = (el: any) => {
    if (!el) return;
    const s = el.getAttribute('data-src') || '';
    if (s && s.indexOf('{{') < 0 && el.src !== s) { el.src = s; }
  };
  onWorkPointer = (e: PointerEvent) => {
    const cell = e.currentTarget as HTMLButtonElement;
    const rect = cell.getBoundingClientRect();
    cell.style.setProperty('--spot-x', (e.clientX - rect.left) + 'px');
    cell.style.setProperty('--spot-y', (e.clientY - rect.top) + 'px');
  };
  onWorkLeave = (e: PointerEvent) => {
    const cell = e.currentTarget as HTMLButtonElement;
    cell.style.removeProperty('--spot-x');
    cell.style.removeProperty('--spot-y');
  };
  onCopy = () => { try { navigator.clipboard && navigator.clipboard.writeText(this.props.handle ?? '@zhugez'); } catch (e) {} };
  closeModal = () => this.setState({ modalIndex: null });
  mascotRef = (el: any) => { this._mascotEl = el; };
  _loadMascot = () => {
    const el = this._mascotEl;
    if (this._disposed || !el || this._mascot || this._mascotLoading) return;
    this._mascotLoading = true;
    import('./mascot3d').then((m) => {
      if (this._disposed || !el.isConnected) return;
      this._mascot = m.mountMascot(el, { base: new URL(import.meta.env.BASE_URL, location.origin), get: () => ({ playing: !!this.state.vinyl?.playing }) });
    }).catch(() => {});
  };
  onMascot = () => {
    if (this._mascot) this._mascot.poke();
    this._playSfx().catch(() => {});
    const lines = ['hi! ✦', 'konichiwa~ ✦', 'ouch >_<', 'hehe ✦', 'try ⌘K ✦', 'play a song? ♪'];
    // always a different line than the one showing
    this.setState((s: any) => ({ say: lines[(lines.indexOf(s.say) + 1 + ((Math.random() * (lines.length - 1)) | 0)) % lines.length], poke: s.poke + 1 }));
  };
  openGear = (e: any) => { if (e && e.preventDefault) e.preventDefault(); this._lastFocus = document.activeElement; document.body.classList.add('dc-modal-lock'); this.setState({ gearOpen: true }); setTimeout(() => { if (this._gearClose) this._gearClose.focus(); }, 60); };
  closeGear = () => { document.body.classList.remove('dc-modal-lock'); this.setState({ gearOpen: false }); if (this._lastFocus && this._lastFocus.focus) setTimeout(() => this._lastFocus.focus(), 0); };
  stop = (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); };
  togglePanel = () => this.setState((s: any) => ({ panelOpen: !s.panelOpen }));
  setDark = () => this.setState({ theme: 'dark' });
  setLight = () => this.setState({ theme: 'light' });
  onHue = (e: any) => this.setState({ hue: +e.target.value });
  openPalette = () => this._openPalette();
  closePalette = () => this._closePalette();
  paletteStop = (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); };
  onPaletteInput = (e: any) => { this.setState({ paletteQuery: e.target.value, paletteIdx: 0 }); };
  _deck() { return this.state.vinyl ? this._room?.deck() : undefined; }
  onPlayer = () => this._deck()?.toggle();
  onSeek = (event: Event) => this._deck()?.seek((event.currentTarget as HTMLInputElement).valueAsNumber);
  toggleMusicBadge = () => {
    const musicOpen = this.state.panelOpen || !this.state.musicOpen;
    this.setState({ musicOpen, panelOpen: false });
    try { localStorage.setItem('zhugez.music.open', musicOpen ? '1' : '0'); } catch {}
  };
  goToTurntable = () => {
    this.setState({ zone: 2 });
    const heading = document.getElementById('make-title');
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ behavior: this._rm ? 'auto' : 'smooth', block: 'start' });
  };
  onRestart = () => this._deck()?.restart();
  onMute = () => this._deck()?.mute();

  view() {

    const vinyl = this.state.vinyl;
    const cur = vinyl?.cur ?? 0, dur = vinyl?.dur ?? 0;
    const frac = dur ? Math.min(1, cur / dur) : 0;
    const hue = this.state.hue, boot = this.state.boot;
    const h2 = (hue + 28) % 360;
    const acc = {
      c: 'var(--accent)', c2: 'var(--accent2)',
      soft: 'hsla(' + hue + ',72%,68%,.18)', glow: 'hsla(' + hue + ',80%,65%,.45)'
    };
    const pal = { p: acc.c, ring: 'conic-gradient(from 0deg,' + acc.c + ',' + acc.c2 + ',' + acc.c + ')' };
    const rawWorks = (this.state.mounted && window.ARISE_WORKS) || [];
    const works = rawWorks.map((src: string, i: number) => ({ src, n: String(i + 1).padStart(2, '0'), open: () => this.setState({ modalIndex: i }) }));
    const modalSrc = (this.state.modalIndex != null && rawWorks[this.state.modalIndex]) || '';
    const gear = GEAR;
    const artistName = this.props.artistName ?? 'Ly Ngoc Vu';
    const handle = this.props.handle ?? '@zhugez';
    const statusText = this.state.typed;
    const aboutText = this.props.aboutText ?? 'Designer, developer & music lover — building web apps, AI tools and audio, with a soft spot for cybersec. Turning ideas into things you can see, hear and use.';
    const ringStyle = { width: '64px', height: '64px', borderRadius: '50%', padding: '3px', background: pal.ring, boxShadow: '0 6px 20px rgba(0,0,0,.4),0 0 22px ' + acc.glow, animation: 'pf-spin 7s linear infinite' };
    const nameStyle = { fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 900, fontSize: '1.375rem', lineHeight: 1, color: 'var(--t1)' };
    const say = boot < 2 ? 'konichiwa~ ✦' : this.state.say, poke = this.state.poke;
    const cursorStyle = { display: 'inline-block', width: '7px', height: '13px', background: pal.p, borderRadius: '1px', animation: 'pf-blink 1.1s steps(1) infinite' };
    const hueLabel = hue + '°';
    const musicOpen = this.state.musicOpen && !this.state.panelOpen;
    const curLabel = this.fmt(cur), durLabel = this.fmt(dur);
    const live = !!vinyl?.playing;
    const title = vinyl?.title ?? '';
    const playerAction = (live ? 'Pause ' : 'Play ') + title;
    const panelOpen = this.state.panelOpen, gearOpen = this.state.gearOpen, paletteOpen = this.state.paletteOpen;
    const btnFlex = { fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '10px', padding: '8px 0', flex: 1, transition: '.15s' };
    const darkBtnStyle = Object.assign({}, btnFlex, this.state.theme === 'dark' ? { border: '1px solid ' + acc.c, background: acc.soft, color: 'var(--t1)' } : { border: '1px solid var(--bd)', background: 'transparent', color: 'var(--t2)' });
    const lightBtnStyle = Object.assign({}, btnFlex, this.state.theme === 'light' ? { border: '1px solid ' + acc.c, background: acc.soft, color: 'var(--t1)' } : { border: '1px solid var(--bd)', background: 'transparent', color: 'var(--t2)' });
    const pIdx = this.state.paletteIdx || 0;
    const baseRow = 'display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;cursor:pointer;border:1px solid transparent;';
    const onRow = baseRow + 'background:var(--accent-soft,color-mix(in srgb,var(--accent) 16%,transparent));border-color:var(--accent);';
    const paletteList = this._filtered().map((c, i) => ({
      label: c.label, hint: c.hint, icon: c.icon,
      rowStyle: i === pIdx ? onRow : baseRow,
      run: (ev: any) => { if (ev && ev.stopPropagation) ev.stopPropagation(); if (c.run) c.run(); }
    }));
    const paletteEmpty = this.state.paletteOpen && this._filtered().length === 0;

    return { vinyl, cur, dur, frac, hue, boot, h2, acc, pal, rawWorks, works, modalSrc, gear, artistName, handle, statusText, aboutText, ringStyle, nameStyle, say, poke, cursorStyle, hueLabel, musicOpen, curLabel, durLabel, live, title, playerAction, panelOpen, gearOpen, paletteOpen, btnFlex, darkBtnStyle, lightBtnStyle, pIdx, baseRow, onRow, paletteList, paletteEmpty };
  }
}
