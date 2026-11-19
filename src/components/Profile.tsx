import { Component } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import ROLL from '../data/soft-static.json';
import { mountAurora } from './aurora';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (m: number) => NOTES[m % 12] + (Math.floor(m / 12) - 1);

const BAR = Number(ROLL.chords[1][0]);
const MELODY = (ROLL.notes as number[][]).filter((n) => n[1] < BAR * 0.9).map((n) => ({ t: n[0], name: noteName(n[2]).toLowerCase() }));
function PlaybackIcon({ playing }: { playing: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
    {playing ? <path d="M7 5h3v14H7zm7 0h3v14h-3z" /> : <path d="M8 5v14l11-7z" />}
  </svg>;
}

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

const MAKE = [
  ['Interfaces', 'Product UI, portfolios and small web apps that feel quick in the hand and calm to the eye.', 'design · web · motion'],
  ['Software', 'Front to back: Astro, Preact, TypeScript, Python. Built lean, shipped often, measured after.', 'dev · tooling · perf'],
  ['Sound', 'A MIDI controller, a pair of monitors and a record player. Tap the deck to hear Soft Static.', 'music · audio · sfx'],
  ['Research', 'Tiny AI models and security work: training, testing, and taking things apart to see how they fail.', 'ai · cyber · lab']
];
const STEPS = [
  ['i', 'Listen', 'Start with the people and the problem. Write down what “done” feels like before drawing anything.'],
  ['ii', 'Sketch', 'Rough frames, rough loops. Cheap to throw away, so I throw a lot away.'],
  ['iii', 'Build', 'Real code early. The browser is the sketchbook that tells the truth.'],
  ['iv', 'Tune', 'Shave the frames, fix the contrast, check it on a bad phone. Then once more.']
];

function Rise(props: any) {
  const ref = useRef<any>(null);
  useEffect(() => {
    const el = ref.current; if (!el || !('IntersectionObserver' in window)) return;
    el.classList.add('rv-armed');
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { el.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = props.as || 'p';
  let k = 0;
  const words = String(props.text).split(' ');
  return (
    <Tag id={props.id} tabIndex={props.tabIndex} ref={ref} class={'rv ' + (props.class || '')}>
      <span class="sr-only">{props.text}</span>
      <span aria-hidden="true">
        {words.map((w: string, wi: number) => [
          <span class="rv-w" key={'w' + wi}>
            {props.chars
              ? w.split('').map((ch, ci) => <span class="rv-m" key={ci}><span class="rv-g" style={'--i:' + (k++)}>{ch}</span></span>)
              : <span class="rv-m"><span class="rv-g" style={'--i:' + (k++ * 2)}>{w}</span></span>}
          </span>,
          wi < words.length - 1 ? ' ' : null
        ])}
      </span>
    </Tag>
  );
}

declare global {
  interface Window {
    ARISE_WORKS: any;
  }
}

export default class Profile extends Component<any, any> {
  state = { playing: false, cur: 0, dur: 0, muted: false, modalIndex: null, theme: 'dark', hue: 226, panelOpen: false, gearOpen: false, typed: '', paletteOpen: false, paletteQuery: '', paletteIdx: 0, boot: 0, say: 'hi! ✦', poke: 0, zone: -1, musicOpen: false, musicError: '' };

  // ---- mutable instance refs / runtime handles ----
  _audio: HTMLAudioElement | null = null;
  _root: any; _page: any; _curDot: any; _curRing: any;
  _sfx: any; _loading = true;
  _paletteInput: any; _gearClose: any; _lastFocus: any;
  _fine = false; _rm = false; _tick: any; _ni = -1; _room: any; _roomIO: any; _aurora: any;
  _float: HTMLElement[] = []; _fi = 0;
  _tx = 0; _ty = 0; _crx = 0; _cry = 0;
  _typeT: any; _loadT: any; _sfxStop: any;
  _bootT: any; _ghT: any; _raf: any; _pRaf: any;
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
  componentDidMount() {
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
    document.querySelectorAll('[style-hover]').forEach((el: any) => {
      if (el._hoverBound) return; el._hoverBound = true;
      const hover = el.getAttribute('style-hover') || '';
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
      }, 1000);
    }, hold);
  }
  // ---- ⌘K command palette ----
  _commands() {
    const go = (id: string) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); this._closePalette(); };
    return [
      { id: 'theme', label: 'Toggle theme', hint: this.state.theme === 'dark' ? '→ light' : '→ dark', icon: '◐', run: () => { this.setState((s: any) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })); this._closePalette(); } },
      { id: 'music', label: this.state.playing ? 'Pause music' : 'Play music', hint: 'now playing', icon: this.state.playing ? '❚❚' : '▶', run: () => { this.onToggle(); this._closePalette(); } },
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
    fetch('https://api.github.com/users/zhugez').then((r) => r.ok ? r.json() : null).then((u) => {
      if (!u) return;
      if (typeof u.public_repos === 'number') set('repos', u.public_repos);
      if (typeof u.followers === 'number') set('followers', u.followers);
    }).catch(() => {});
    fetch('https://api.github.com/users/zhugez/repos?per_page=100&sort=updated').then((r) => r.ok ? r.json() : null).then((rs) => {
      if (!Array.isArray(rs)) return;
      const stars = rs.reduce((a, b) => a + ((b && b.stargazers_count) || 0), 0);
      set('stars', stars);
    }).catch(() => {});
  }
  componentWillUnmount() { if (this._aurora) this._aurora(); if (this._roomIO) this._roomIO.disconnect(); if (this._room) this._room.dispose(); clearTimeout(this._typeT); clearTimeout(this._loadT); clearTimeout(this._sfxStop); clearTimeout(this._bootT); cancelAnimationFrame(this._raf); cancelAnimationFrame(this._pRaf); window.removeEventListener('mousemove', this._onMove); window.removeEventListener('keydown', this._onKey); window.removeEventListener('pointerover', this._onOver); clearTimeout(this._tiltT); clearTimeout(this._ghT); cancelAnimationFrame(this._tick); if (this._onDown) window.removeEventListener('pointerdown', this._onDown, true); document.documentElement.classList.remove('dc-cursor-on'); document.body.classList.remove('dc-modal-lock'); if (this._pResize) window.removeEventListener('resize', this._pResize); }
  fmt(s: number) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60), x = Math.floor(s % 60); return m + ':' + String(x).padStart(2, '0'); }
  _initAudio(el: HTMLAudioElement | null) {
    if (!el || this._audio === el) return;
    this._audio = el;
    el.volume = .7;
    const update = (exact = false) => {
      const t = el.currentTime;
      let ni = -1;
      for (let i = 0; i < MELODY.length && MELODY[i].t <= t; i++) ni = i;
      if (exact || ni !== this._ni || Math.floor(t) !== Math.floor(this.state.cur)) {
        if (!exact && ni >= 0 && ni !== this._ni) this._floatNote(MELODY[ni].name.toUpperCase());
        this._ni = ni;
        this.setState({ cur: t });
      }
    };
    const tick = () => {
      update();
      if (!el.paused) this._tick = requestAnimationFrame(tick);
    };
    el.addEventListener('playing', () => {
      this.setState({ playing: true, musicError: '' });
      cancelAnimationFrame(this._tick);
      tick();
    });
    el.addEventListener('pause', () => {
      cancelAnimationFrame(this._tick);
      this.setState({ playing: false });
      update(true);
    });
    el.addEventListener('seeked', () => update(true));
    const setDuration = () => this.setState({ dur: Number.isFinite(el.duration) ? el.duration : 0 });
    el.addEventListener('durationchange', setDuration);
    el.addEventListener('error', () => this.setState({ playing: false, musicError: 'The track could not load.' }));
    setDuration();
  }
  audioRef = (el: HTMLAudioElement | null) => { this._initAudio(el); };
  floatRef = (el: HTMLElement | null) => {
    if (!el || this._float.length) return;
    this._float = Array.from({ length: 8 }, () => el.appendChild(document.createElement('span')));
    el.addEventListener('animationend', (e) => (e.target as HTMLElement).classList.remove('on'));
  };
  _floatNote(name: string) {
    const s = this.state;
    if (this._rm || document.hidden || s.modalIndex != null || s.gearOpen || s.paletteOpen) return;
    const n = this._float[this._fi++ % this._float.length];
    if (!n || n.classList.contains('on')) return;
    const r = Math.random;
    n.textContent = name;
    n.style.cssText = '--x:' + (24 + r() * 250) + 'px;--dx:' + (r() * 80 - 56) + 'px;--rise:' + (26 + r() * 30) + 'vh;--size:' + (1.1 + r() * 1.1) + 'rem;--o:' + (0.7 + r() * 0.3) + ';--d:' + (2600 + r() * 1200) + 'ms;--c:var(--' + (this._fi % 2 ? 'accent' : 'accent2') + ')';
    n.classList.add('on');
  }
  auroraRef = (el: any) => { if (el && !this._aurora) this._aurora = mountAurora(el, () => this.state.hue, () => [this._tx || 0, this._ty || 0]); };
  roomRef = (el: any) => {
    if (!el || this._roomIO || !('IntersectionObserver' in window)) return;
    this._roomIO = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      this._roomIO.disconnect();
      import('./room').then((m) => {
        if (!el.isConnected) return;
        this._room = m.mountRoom(el, {
          get: () => ({ playing: this.state.playing, active: this.state.zone, note: MELODY[this._ni]?.name ?? '' }),
          onToggle: this.onToggle,
          onHover: (z) => this.setState({ zone: z }),
          art: (window.ARISE_WORKS || [])[0],
          gear: GEAR.map((g) => g.name)
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
  onMascot = () => {
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
  onToggle = () => {
    const audio = this._audio;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch((error: DOMException) => {
        if (error.name !== 'AbortError') this.setState({ musicError: 'Playback could not start. Try again.' });
      });
    } else audio.pause();
  };
  onSeek = (event: Event) => {
    if (!this._audio || !this.state.dur) return;
    this._audio.currentTime = (event.currentTarget as HTMLInputElement).valueAsNumber;
    this.setState({ cur: this._audio.currentTime });
  };
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
  onRestart = () => { const a = this._audio; if (a) a.currentTime = 0; };
  onMute = () => { const a = this._audio; if (!a) return; a.muted = !a.muted; this.setState({ muted: a.muted }); };

  render() {
    const frac = this.state.dur ? Math.min(1, this.state.cur / this.state.dur) : 0;
    const hue = this.state.hue, boot = this.state.boot;
    const h2 = (hue + 28) % 360;
    const acc = {
      c: 'var(--accent)', c2: 'var(--accent2)',
      soft: 'hsla(' + hue + ',72%,68%,.18)', glow: 'hsla(' + hue + ',80%,65%,.45)'
    };
    const pal = { p: acc.c, ring: 'conic-gradient(from 0deg,' + acc.c + ',' + acc.c2 + ',' + acc.c + ')' };
    this._applyTheme(this._page);
    const rawWorks = (typeof window !== 'undefined' && window.ARISE_WORKS) ? window.ARISE_WORKS : [];
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
    const { playing, muted, musicError } = this.state;
    const musicOpen = this.state.musicOpen && !this.state.panelOpen;
    const action = playing ? 'Pause Soft Static' : 'Play Soft Static';
    const note = MELODY[this._ni]?.name.toUpperCase();
    const curLabel = this.fmt(this.state.cur), durLabel = this.fmt(this.state.dur);
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

    return (
      <div ref={this.pageRef} class="page">

        <audio ref={this.audioRef} src="media/soft-static.mp3" preload="metadata" loop />
        <audio ref={this.sfxRef} src="media/konichiwa.mp3" preload="auto"></audio>
        {boot < 2 && <div class="boot" style={boot ? 'opacity:0;pointer-events:none;' : ''}></div>}

        <canvas ref={this.auroraRef} class="aurora" aria-hidden="true"></canvas>
        <picture class="scene" aria-hidden="true">
          <source media="(prefers-reduced-motion: reduce)" srcset="media/scene-still.webp" />
          <img src="media/scene.webp" alt="" />
        </picture>
        <div class="scrim"></div>
        <canvas ref={this.particleRef} class="flies" aria-hidden="true"></canvas>
        <div ref={this.floatRef} class="music-float" aria-hidden="true"></div>
        <div class="grain" aria-hidden="true"></div>

        <div id="dcCurRing" class="dc-cursor" ref={this.curRingRef}></div>
        <div id="dcCurDot" class="dc-cursor" ref={this.curDotRef}></div>

        <header class="hero" id="top">
          <nav class="hero-nav" aria-label="Main navigation">
            <a class="site-mark" href="#top" aria-label="ZhugeZ home">z<span class="wob" aria-hidden="true">✦</span></a>
            <div class="nav-links"><a href="#sec-works">Artworks</a><a href="#sec-about">About</a><a href="#sec-music">Music</a></div>
            <a class="nav-contact" href="mailto:dezzhuge@gmail.com">Say hello <span aria-hidden="true">↗</span></a>
          </nav>
          <div class="hero-main">
          <div class="hero-copy">
          <h1 class={'hero-word' + (boot === 0 ? ' intro' : '') + (boot < 2 ? ' greet' : '')}>Zhuge<span class="word-z">Z</span></h1>
          <p class="hero-role">Designer, developer<br /><em>&amp; music lover.</em></p>
          <p class="hero-note">Turning ideas into things<br />you can see, hear and use.</p>
          <div class="hero-actions"><a class="hero-primary" href="#sec-about">Meet the maker <span aria-hidden="true">↓</span></a><a class="hero-secondary" href="#sec-music">Explore the studio <span aria-hidden="true">↓</span></a></div>
          <div class="hero-id">
            <div class="hero-who">
                  <div style="position:relative;flex:none;">
                    <div style={ringStyle}>
                      <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;background:var(--card);border:3px solid var(--card);animation:pf-spinr 7s linear infinite;">
                        <img src="media/avatar.webp" alt="avatar" style="width:100%;height:100%;object-fit:cover;display:block;" />
                      </div>
                    </div>
                    <span style="position:absolute;right:3px;bottom:3px;width:16px;height:16px;border-radius:50%;background:#43d17a;border:3px solid var(--card);animation:pf-pip 2.4s infinite;z-index:2;"></span>
                  </div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style={nameStyle}>{artistName}</span>
                  <span style="font-size:0.8125rem;color:var(--accent);display:inline-block;animation:pf-twinkle 2.6s ease-in-out infinite;">✦</span>
                  </div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem;color:var(--t2);margin-top:6px;cursor:pointer;" onClick={this.onCopy} title="copy handle">{handle} · <span style="color:var(--t4);">#0001</span></div>
                </div>
            </div>
                <div class="hero-badges" style="flex-wrap:wrap;gap:6px;">
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);padding:3px 9px;border-radius:8px;">◆ Designer</span>
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--accent2);background:color-mix(in srgb,var(--accent2) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent2) 30%,transparent);padding:3px 9px;border-radius:8px;">✦ Developer</span>
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:#ffcf6b;background:rgba(255,207,107,.1);border:1px solid rgba(255,207,107,.28);padding:3px 9px;border-radius:8px;">♪ Music lover</span>
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:#f2a88a;background:rgba(232,130,96,.1);border:1px solid rgba(232,130,96,.28);padding:3px 9px;border-radius:8px;">🛡 Security</span>
                </div>
                <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid var(--bd);border-radius:10px;padding:7px 11px;">
                  <span style="font-size:0.75rem;">🎨</span>
                  <span style="font-size:0.75rem;color:var(--t2);">{statusText}</span>
                  <span style={cursorStyle}></span>
                </div>
                <div class="hero-joined" style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);">Joined since 2024</div>
          </div>
          </div>
          <section id="sec-works" class="works">
            <div class="works-head">
              <h2 class="works-title">Artworks<span class="wob" aria-hidden="true">✦</span></h2>
              <span class="works-hint">Move your light. Find the colour.</span>
            </div>
            <div class="works-row">
              {works.map((w, i) => (
                <button key={i} type="button" class="work-cell" onClick={w.open} onPointerEnter={this.onWorkPointer} onPointerMove={this.onWorkPointer} onPointerLeave={this.onWorkLeave} onPointerCancel={this.onWorkLeave} aria-label={'Enlarge artwork ' + w.n}>
                  <img class="work-base" ref={this.imgSrcRef} data-src={w.src} alt="" />
                  <img class="work-color" ref={this.imgSrcRef} data-src={w.src} alt="" aria-hidden="true" />
                  <span class="work-idx" aria-hidden="true">{w.n}</span>
                </button>
              ))}
            </div>

          </section>
          </div>

          <button type="button" class={'mascot' + (boot === 0 ? ' intro' : '') + (boot < 2 ? ' greet' : '') + (playing ? ' dance' : '')} onClick={this.onMascot}>
            <span class="mascot-bob">
              <span class={'mascot-pop' + (poke ? (poke % 2 ? ' pa' : ' pb') : '')}><img src="media/mascot-cut.webp" alt="mascot" /></span>
              <span class="say">{say}</span>
            </span>
          </button>
        </header>

        <main ref={this.rootRef} class="wrap">

          <section class="intro-block">
            <Rise as="h2" chars class="display" text="Design, code & sound." />
            <Rise class="lede" text="I work across interfaces and software, and I’m curious about the details that make them feel right: a transition, a sound, or a tool that gets out of the way." />
          </section>

          <section id="sec-music" class="make" aria-labelledby="make-title">
            <Rise as="h2" id="make-title" tabIndex={-1} chars class="display" text="Inside the studio." />
            <div class="make-grid">
            <div class="room" ref={this.roomRef} role="img" aria-label="Isometric studio with a two-tier producer desk, MIDI controller, record player and server rack"></div>
            <ol class="make-list">
              {MAKE.map((m, i) => (
                <li key={i} class={this.state.zone === i ? 'on' : ''} onPointerEnter={() => this.setState({ zone: i })} onPointerLeave={() => this.setState({ zone: -1 })}>
                  <span class="make-n">{'0' + (i + 1)}</span>
                  <Rise as="h3" chars class="make-t" text={m[0]} />
                  <Rise class="make-d" text={m[1]} />
                  <span class="make-tags">{m[2]}</span>
                  {i === 2 && <div class="room-track">
                    <button type="button" class="room-play" onClick={this.onToggle} aria-label={action}>
                      <PlaybackIcon playing={playing} /><span>{playing ? 'Pause' : 'Play'} <strong>Soft Static</strong></span>
                    </button>
                    {musicError && <small role="status">{musicError}</small>}
                  </div>}
                </li>
              ))}
            </ol>
            </div>
          </section>

          <section class="process">
            <Rise as="h2" chars class="display" text="Slow ears, fast hands." />
            <div class="steps">
              {STEPS.map((st, i) => (
                <div class="step" key={i}>
                  <span class="step-n">{st[0]}</span>
                  <Rise as="h3" chars class="step-t" text={st[1]} />
                  <Rise class="step-d" text={st[2]} />
                </div>
              ))}
            </div>
          </section>

          <div class="grid profile-index">

            {/* about me */}
            <div id="sec-about" class="index-section s12">
              <h2>About</h2>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:15px;">
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent);border:1px solid color-mix(in srgb,var(--accent) 24%,transparent);padding:4px 11px;border-radius:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z" /><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18" /><path d="m2.3 2.3 7.286 7.286" /><circle cx="11" cy="11" r="2" /></svg>Design</span>
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--accent2);background:color-mix(in srgb,var(--accent2) 10%,transparent);border:1px solid color-mix(in srgb,var(--accent2) 24%,transparent);padding:4px 11px;border-radius:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>Dev</span>
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#9ff0d0;background:rgba(67,209,122,.1);border:1px solid rgba(67,209,122,.24);padding:4px 11px;border-radius:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>Music</span>
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#f2a88a;background:rgba(232,130,96,.1);border:1px solid rgba(232,130,96,.24);padding:4px 11px;border-radius:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" /></svg>AI</span>
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#ffd79a;background:rgba(255,207,107,.1);border:1px solid rgba(255,207,107,.24);padding:4px 11px;border-radius:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>Cyber</span>
              </div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem;color:var(--accent2);margin-bottom:8px;">&gt; currently shipping side projects...</div>
              <p style="margin:0;font-size:0.875rem;line-height:1.7;color:var(--t2);">{aboutText}</p>
              <p style="margin:10px 0 0;font-size:0.875rem;line-height:1.7;color:var(--t2);">dm me if u wanna talk about <span style="color:var(--accent);font-weight:600;">design, music, code or AI</span> :)</p>
            </div>

            {/* zhuge in tech */}
            <div id="sec-tech" class="index-section s12">
              <h2>Elsewhere on the web</h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:10px;">
                <a class="soc" href="https://sec.lyngocvu.tech" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" style-hover="border-color:#ff5555;transform:translateY(-3px);box-shadow:0 0 20px rgba(255,85,85,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(255,85,85,.14);display:flex;align-items:center;justify-content:center;color:#ff8585;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></span>
                  <div style="min-width:0;">
                    <div style="font-size:0.875rem;color:var(--t1);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Security & VR</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);">sec.lyngocvu.tech</div>
                  </div>
                </a>
                <a class="soc" href="https://dev.lyngocvu.tech" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" style-hover="border-color:#5ee0ff;transform:translateY(-3px);box-shadow:0 0 20px rgba(94,224,255,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(94,224,255,.14);display:flex;align-items:center;justify-content:center;color:#9fe9ff;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></span>
                  <div style="min-width:0;">
                    <div style="font-size:0.875rem;color:var(--t1);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Software & Dev</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);">dev.lyngocvu.tech</div>
                  </div>
                </a>
                <a class="soc" href="https://editor.lyngocvu.tech" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" style-hover="border-color:#ffd166;transform:translateY(-3px);box-shadow:0 0 20px rgba(255,209,102,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(255,209,102,.14);display:flex;align-items:center;justify-content:center;color:#ffe08a;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg></span>
                  <div style="min-width:0;">
                    <div style="font-size:0.875rem;color:var(--t1);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Video Editor & Designer</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);">editor.lyngocvu.tech</div>
                  </div>
                </a>
                <a class="soc" href="https://research.lyngocvu.tech" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" style-hover="border-color:var(--accent);transform:translateY(-3px);box-shadow:0 0 20px rgba(201,182,255,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(201,182,255,.14);display:flex;align-items:center;justify-content:center;color:#d8c9ff;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>
                  <div style="min-width:0;">
                    <div style="font-size:0.875rem;color:var(--t1);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Research & Lab</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);">research.lyngocvu.tech</div>
                  </div>
                </a>
              </div>
            </div>

            {/* socials */}
            <div id="sec-socials" class="index-section s5">
              <h2>Socials</h2>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <a class="soc" href="#" data-discord="zhugez" title="Discord: cập nhật handle" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" style-hover="border-color:#7c9bff;transform:translateY(-3px);box-shadow:0 0 20px rgba(124,155,255,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(124,155,255,.14);display:flex;align-items:center;justify-content:center;color:#aab8f5;"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.369A19.79 19.79 0 0 0 15.432 3c-.21.375-.45.88-.617 1.28a18.27 18.27 0 0 0-5.63 0A12.6 12.6 0 0 0 8.56 3 19.74 19.74 0 0 0 3.677 4.37C.533 9.046-.32 13.58.1 18.057a19.9 19.9 0 0 0 6.073 3.058c.49-.668.927-1.377 1.304-2.122a12.9 12.9 0 0 1-2.05-.978c.172-.126.34-.258.502-.392a14.2 14.2 0 0 0 12.142 0c.164.139.332.27.502.392-.654.388-1.34.716-2.05.978.377.745.814 1.454 1.304 2.122a19.86 19.86 0 0 0 6.073-3.058c.5-5.177-.838-9.674-3.56-13.688zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.955 2.419-2.157 2.419zm7.96 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419z"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">Discord</span>
                </a>
                <a class="soc" href="https://twitter.com/dezzhu1" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" style-hover="border-color:#5ee0ff;transform:translateY(-3px);box-shadow:0 0 20px rgba(94,224,255,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(94,224,255,.14);display:flex;align-items:center;justify-content:center;color:#9fe9ff;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">Twitter</span>
                </a>
                <a class="soc" href="https://github.com/zhugez" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" style-hover="border-color:var(--t2);transform:translateY(-3px);box-shadow:0 0 20px rgba(174,182,210,.4);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(200,210,235,.12);display:flex;align-items:center;justify-content:center;color:var(--t2);"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">GitHub</span>
                </a>
                <a class="soc" href="https://shadowforge.vercel.app" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" style-hover="border-color:var(--accent);transform:translateY(-3px);box-shadow:0 0 20px var(--accent);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:color-mix(in srgb,var(--accent) 14%,transparent);display:flex;align-items:center;justify-content:center;color:var(--accent);"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">Portfolio</span>
                </a>
                <a class="soc" href="mailto:dezzhuge@gmail.com" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" style-hover="border-color:#43d17a;transform:translateY(-3px);box-shadow:0 0 20px rgba(67,209,122,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(67,209,122,.14);display:flex;align-items:center;justify-content:center;color:#9ff0d0;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">Email</span>
                </a>
              </div>
            </div>

            {/* links */}
            <div id="sec-links" class="index-section s4">
              <h2>Links & setup</h2>
              <div style="display:flex;flex-direction:column;gap:10px;">
                <a href="#" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:12px 14px;transition:.18s;" style-hover="border-color:var(--accent);transform:translateX(3px);">
                  <span style="width:8px;height:8px;border-radius:50%;background:var(--accent);"></span>
                  <span style="flex:1;font-size:0.875rem;color:var(--t1);font-weight:500;">📄 Resume / CV</span>
                  <span style="color:var(--t4);">↗</span>
                </a>
                <a href="#" onClick={this.openGear} style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:12px 14px;transition:.18s;cursor:pointer;" style-hover="border-color:var(--accent2);transform:translateX(3px);">
                  <span style="width:8px;height:8px;border-radius:50%;background:var(--accent2);"></span>
                  <span style="flex:1;font-size:0.875rem;color:var(--t1);font-weight:500;">🛠️ Tech Stack & Setup</span>
                  <span style="color:var(--t4);">↗</span>
                </a>
                <a href="https://github.com/zhugez?tab=repositories" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:12px 14px;transition:.18s;" style-hover="border-color:var(--accent);transform:translateX(3px);">
                  <span style="width:8px;height:8px;border-radius:50%;background:var(--accent);"></span>
                  <span style="flex:1;font-size:0.875rem;color:var(--t1);font-weight:500;">⭐ GitHub Repos</span>
                  <span style="color:var(--t4);">↗</span>
                </a>
              </div>
            </div>

            {/* stats */}
            <div class="index-section s3">
              <h2>GitHub</h2>
              <div class="stats-col">
                <div class="stat"><span class="stat-n" data-count="42" data-gh="repos">42</span><span class="stat-l">repos</span></div>
                <div class="stat"><span class="stat-n" data-count="21" data-gh="followers">21</span><span class="stat-l">followers</span></div>
                <div class="stat"><span class="stat-n" data-count="28" data-gh="stars">28</span><span class="stat-l">stars</span></div>
              </div>
            </div>

          </div>

          <section class="outro">
            <Rise as="h2" chars class="display big" text="Let’s make something that sticks." />
            <a class="outro-mail" href="mailto:dezzhuge@gmail.com">dezzhuge@gmail.com <span aria-hidden="true">↗</span></a>
          </section>

          <div style="text-align:center;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);padding:26px 0 6px;">© 2026 zhugez</div>

        </main>

        <button type="button" class="mag" onClick={this.openPalette} aria-label="Open command palette" style="position:fixed;left:18px;bottom:18px;z-index:55;display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;border:1px solid var(--bd);border-radius:99px;background:var(--card);color:var(--t2);cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4);font-family:'JetBrains Mono',monospace;font-size:0.75rem;transition:transform .15s,border-color .15s,color .15s;" style-hover="transform:translateY(-2px);border-color:var(--accent);color:var(--t1);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          <span style="display:flex;align-items:center;gap:3px;"><kbd style="font-family:inherit;background:var(--panel);border:1px solid var(--bd2);border-radius:5px;padding:1px 5px;font-size:0.6875rem;color:var(--t3);">⌘</kbd><kbd style="font-family:inherit;background:var(--panel);border:1px solid var(--bd2);border-radius:5px;padding:1px 5px;font-size:0.6875rem;color:var(--t3);">K</kbd></span>
        </button>

        <aside class={'music-badge' + (playing ? ' is-playing' : '')} style={'--track-progress:' + frac * 100 + '%'} aria-label="Music controls" hidden={boot < 2 || !!modalSrc || gearOpen || paletteOpen}>
          <button type="button" class="music-record" onClick={this.toggleMusicBadge} aria-expanded={musicOpen} aria-controls="music-options" aria-label="Soft Static player" title={musicOpen ? 'Hide player' : 'Show player'}>
            <span class="music-disc" aria-hidden="true" />
          </button>
          <div class="music-options" id="music-options" hidden={!musicOpen}>
            <div class="music-track">
              <div><small>{playing ? 'Now playing' : 'Paused'}</small><strong>Soft Static</strong></div>
              <span class="music-note">{note ?? '—'}</span>
            </div>
            <div class="music-transport">
              <button type="button" class="music-play" onClick={this.onToggle} aria-label={action}><PlaybackIcon playing={playing} /></button>
              <div class="music-scrub">
                <input type="range" class="music-seek" aria-label="Seek Soft Static" aria-valuetext={curLabel + ' of ' + durLabel} min={0} max={this.state.dur || 1} step="0.1" value={this.state.cur} disabled={!this.state.dur} onInput={this.onSeek} />
                <div class="music-time"><span>{curLabel}</span><span>{durLabel}</span></div>
              </div>
            </div>
            <div class="music-actions">
              <button type="button" onClick={this.onRestart}>Restart</button>
              <button type="button" onClick={this.onMute}>{muted ? 'Unmute' : 'Mute'}</button>
              <button type="button" onClick={this.goToTurntable}>Studio ↗</button>
            </div>
            {musicError && <small role="status">{musicError}</small>}
          </div>
        </aside>

        <div class="theme-dock" style="position:fixed;right:18px;bottom:18px;z-index:55;display:flex;flex-direction:column;align-items:flex-end;gap:10px;">
          {panelOpen && (
            <div style="background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:14px;box-shadow:0 16px 40px rgba(0,0,0,.4);width:206px;">
              <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.12em;color:var(--t3);text-transform:uppercase;margin-bottom:9px;">theme</div>
              <div style="display:flex;gap:8px;margin-bottom:15px;">
                <button type="button" onClick={this.setDark} style={darkBtnStyle}>☾ Dark</button>
                <button type="button" onClick={this.setLight} style={lightBtnStyle}>☀ Light</button>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.12em;color:var(--t3);text-transform:uppercase;">accent</span><span style="display:flex;align-items:center;gap:6px;"><span style="width:15px;height:15px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t2);">{hueLabel}</span></span></div>
              <input type="range" min="0" max="360" value={hue} onInput={this.onHue} aria-label="Accent hue" style="width:100%;height:12px;border-radius:99px;cursor:pointer;outline:none;background:linear-gradient(90deg,hsl(0 80% 65%),hsl(60 80% 65%),hsl(120 80% 65%),hsl(180 80% 65%),hsl(240 80% 65%),hsl(300 80% 65%),hsl(360 80% 65%));" />
            </div>
          )}
          <button type="button" class="mag" onClick={this.togglePanel} aria-label="Theme settings" style="width:50px;height:50px;border-radius:50%;border:1px solid var(--bd);cursor:pointer;background:var(--card);color:var(--accent);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:transform .15s;" style-hover="transform:scale(1.08) rotate(8deg);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg></button>
        </div>

        {modalSrc && (
          <div onClick={this.closeModal} role="dialog" aria-modal="true" aria-label="Work detail" style="position:fixed;inset:0;z-index:60;background:rgba(5,9,8,.86);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:28px;cursor:zoom-out;">
            <img ref={this.imgSrcRef} data-src={modalSrc} alt="artwork" style="max-width:90vw;max-height:86vh;border-radius:16px;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 60px color-mix(in srgb,var(--accent) 30%,transparent);" />
          </div>
        )}

        {gearOpen && (
          <div onClick={this.closeGear} role="dialog" aria-modal="true" aria-label="Gear and setup" style="position:fixed;inset:0;z-index:62;background:rgba(5,9,8,.86);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:24px;">
            <div onClick={this.stop} style="width:100%;max-width:min(94vw,920px);max-height:90vh;background:var(--card);border:1px solid var(--bd);border-radius:16px;box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 60px var(--accent-soft,color-mix(in srgb,var(--accent) 30%,transparent));">
              <div style="position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;padding:15px 18px;background:var(--card);border-bottom:1px solid var(--bd);z-index:1;">
                <div style="display:flex;align-items:center;gap:8px;"><span style="width:4px;height:14px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;letter-spacing:.14em;color:var(--t2);text-transform:uppercase;">gear & setup</span></div>
                <button type="button" ref={this.gearCloseRef} onClick={this.closeGear} aria-label="Close" style="width:44px;height:44px;border-radius:10px;border:1px solid var(--bd);background:var(--panel);color:var(--t2);cursor:pointer;font-size:0.9375rem;line-height:1;display:flex;align-items:center;justify-content:center;">✕</button>
              </div>
              <div class="gear-grid" style="display:grid;grid-auto-flow:column;grid-template-rows:repeat(3,1fr);grid-auto-columns:192px;gap:12px;overflow-x:auto;overflow-y:hidden;padding:16px 18px 20px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;">
                {gear.map((g, i) => (
                  <div key={i} style="scroll-snap-align:start;display:flex;flex-direction:column;gap:8px;background:var(--panel);border:1px solid var(--bd2);border-radius:12px;padding:13px 14px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <div style="flex:none;width:40px;height:40px;border-radius:10px;background:color-mix(in srgb,var(--accent) 12%,transparent);display:flex;align-items:center;justify-content:center;font-size:1.25rem;">{g.ic}</div>
                      {g.url && <a href={g.url} target="_blank" rel="noopener" onClick={this.stop} style="color:var(--accent2);text-decoration:none;font-size:0.8125rem;">↗</a>}
                    </div>
                    <div style="min-width:0;">
                      <div style="font-size:0.8125rem;color:var(--t1);font-weight:600;line-height:1.3;">{g.name}</div>
                      <div style="font-size:0.6875rem;color:var(--t3);margin-top:3px;line-height:1.4;">{g.desc}</div>
                      {g.variation && <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);margin-top:5px;">{g.variation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {paletteOpen && (
          <div onClick={this.closePalette} role="dialog" aria-modal="true" aria-label="Command palette" style="position:fixed;inset:0;z-index:80;background:rgba(5,9,8,.7);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:flex-start;justify-content:center;padding:14vh 20px 20px;">
            <div onClick={this.paletteStop} style="width:100%;max-width:560px;background:var(--card);border:1px solid var(--bd);border-radius:16px;box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 60px var(--accent-soft,color-mix(in srgb,var(--accent) 30%,transparent));overflow:hidden;">
              <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--bd);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                <input ref={this.paletteInputRef} onInput={this.onPaletteInput} type="text" placeholder="Type a command or jump to…" aria-label="Command palette search" autocomplete="off" spellcheck={false} style="flex:1;background:none;border:none;outline:none;color:var(--t1);font-family:'Hanken Grotesk',sans-serif;font-size:1rem;min-width:0;" />
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);border:1px solid var(--bd);border-radius:6px;padding:2px 6px;">esc</span>
              </div>
              <div style="max-height:46vh;overflow:auto;padding:8px;">
                {paletteList.map((cmd, i) => (
                  <div key={i} class="cmd-row" onClick={cmd.run} style={cmd.rowStyle}>
                    <span style="flex:none;width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:0.875rem;background:var(--accent-soft,color-mix(in srgb,var(--accent) 16%,transparent));color:var(--accent2);">{cmd.icon}</span>
                    <span style="flex:1;min-width:0;font-size:0.875rem;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{cmd.label}</span>
                    <span style="flex:none;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);">{cmd.hint}</span>
                  </div>
                ))}
                {paletteEmpty && <div style="padding:18px 12px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--t4);">no matches</div>}
              </div>
              <div style="display:flex;align-items:center;gap:14px;padding:9px 14px;border-top:1px solid var(--bd);font-family:'JetBrains Mono',monospace;font-size:0.625rem;color:var(--t4);">
                <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
