import { Component } from 'preact';

declare global {
  interface Window {
    anime: any;
    YT: any;
    ARISE_WORKS: any;
    onYouTubeIframeAPIReady: any;
  }
}

export default class Profile extends Component<any, any> {
  state = { tick: 0, playing: false, cur: 0, dur: 0, muted: false, modalIndex: null, theme: 'dark', hue: 226, panelOpen: false, gearOpen: false, typed: '', vibeIdx: 0, trackTitle: 'loading track…', paletteOpen: false, paletteQuery: '', paletteIdx: 0 };
  POS_KEY = 'arise_yt_pos';
  VIDEO_ID = 'eCkMQraVsUA';

  // ---- mutable instance refs / runtime handles ----
  _player: any; _ytEl: any; _root: any; _page: any; _glow: any; _curDot: any; _curRing: any;
  _loader: any; _sfx: any; _loaderFill: any; _loaderPct: any; _loaderLog: any; _loaderMsg: any;
  _paletteInput: any; _gearClose: any; _lastFocus: any;
  _usingSpotify = false; _videoId = ''; _spM: any = null; _loadedId = '';
  _fine = false; _rm = false; _fxDone = false;
  _mx = 0; _my = 0; _tx = 0; _ty = 0; _crx = 0; _cry = 0;
  _clk: any; _poll: any; _animT: any; _typeT: any; _loadT: any; _loadFail: any; _sfxStop: any;
  _bootT: any; _vibeT: any; _ghT: any; _raf: any; _pRaf: any; _vizRaf: any; _auroraRaf: any;
  _tiltT: any; _onMove: any; _onKey: any; _onOver: any; _onDown: any; _auroraResize: any;
  _vizResize: any; _pResize: any; _runEntrance: any;

  _vibe() {
    const v = [
      ['cozy & creative', 'late-night sessions'],
      ['in the zone', 'headphones on'],
      ['dreamy mood', 'soft neon haze'],
      ['caffeinated', 'third coffee today'],
      ['feeling inspired', 'editor open']
    ];
    return v[(this.state.vibeIdx || 0) % v.length];
  }
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
    this._clk = setInterval(() => this.setState((s: any) => ({ tick: s.tick + 1 })), 20000);
    window.onYouTubeIframeAPIReady = () => { this._initYT(); };
    this._initYT();
    // mouse-follow glow
    this._mx = window.innerWidth / 2; this._my = window.innerHeight / 2; this._tx = this._mx; this._ty = this._my; this._crx = this._mx; this._cry = this._my;
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
        this._root.querySelectorAll(':scope > div').forEach((c: any) => { c.style.perspective = '1000px'; });
        this._root.querySelectorAll(':scope > div > div').forEach((card: any) => {
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
      this._mx += (this._tx - this._mx) * 0.12; this._my += (this._ty - this._my) * 0.12;
      if (this._glow) this._glow.style.transform = 'translate(' + this._mx + 'px,' + this._my + 'px) translate(-50%,-50%)';
      if (this._curDot) this._curDot.style.transform = 'translate(' + this._tx + 'px,' + this._ty + 'px) translate(-50%,-50%)';
      this._crx += (this._tx - this._crx) * 0.25; this._cry += (this._ty - this._cry) * 0.25;
      if (this._curRing) this._curRing.style.transform = 'translate(' + this._crx + 'px,' + this._cry + 'px) translate(-50%,-50%)';
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
    // anime.js entrance + count-up
    const run = () => {
      if (!window.anime) { this._animT = setTimeout(run, 120); return; }
      const anime = window.anime;
      if (this._root && !this._fxDone) {
        this._fxDone = true;
        const cards = this._root.querySelectorAll(':scope > div > div');
        cards.forEach((c: any) => { c.style.opacity = 0; });
        anime({ targets: cards, translateY: [24, 0], opacity: [0, 1], delay: anime.stagger(55), duration: 680, easing: 'easeOutCubic' });
        const badges = this._root.querySelectorAll(':scope > div > div span[style*="border-radius:8px"]');
        anime({ targets: badges, scale: [0.6, 1], opacity: [0, 1], delay: anime.stagger(40, { start: 400 }), duration: 500, easing: 'easeOutBack' });
        document.querySelectorAll('[data-count]').forEach((el: any) => {
          const end = parseFloat(el.getAttribute('data-count')) || 0; const obj = { v: 0 };
          anime({ targets: obj, v: end, duration: 1500, delay: 500, easing: 'easeOutExpo', round: 1, update: () => { el.textContent = obj.v; } });
        });
      }
    };
    this._runEntrance = run;
    this._startTyping();
    this._vibeT = setInterval(() => this.setState((s: any) => ({ vibeIdx: (s.vibeIdx + 1) % 5 })), 3800);
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
  _startLoader() {
    const lo = this._loader;
    const finish = () => { if (this._runEntrance) this._runEntrance(); };
    // play the konichiwa sfx; if autoplay blocked, play on first interaction
    const sfx = this._sfx;
    if (sfx) {
      sfx.volume = 0.7;
      const tryPlay = () => { try { sfx.currentTime = 0; const pr = sfx.play(); clearTimeout(this._sfxStop); this._sfxStop = setTimeout(() => { try { sfx.pause(); } catch (e) {} }, 2000); return pr; } catch (e) { return Promise.reject(e); } };
      const armOnce = () => {
        const h = () => { tryPlay().catch(() => {}); window.removeEventListener('pointerdown', h); window.removeEventListener('keydown', h); };
        window.addEventListener('pointerdown', h, { once: true }); window.addEventListener('keydown', h, { once: true });
      };
      const p = tryPlay(); if (p && p.catch) p.catch(() => armOnce()); else armOnce();
    }
    if (!lo) { finish(); return; }
    const go = () => {
      if (!window.anime) { this._loadT = setTimeout(go, 100); return; }
      const anime = window.anime;
      const obj = { p: 0 };
      anime({ targets: obj, p: 100, duration: 1500, easing: 'easeInOutCubic',
        update: () => { if (this._loaderFill) this._loaderFill.style.width = obj.p + '%'; if (this._loaderPct) this._loaderPct.textContent = Math.round(obj.p) + '%'; },
        complete: () => {
          anime({ targets: lo, opacity: [1, 0], duration: 650, easing: 'easeOutQuad',
            complete: () => { lo.style.display = 'none'; finish(); } });
        }
      });
    };
    this._bootLog();
    go();
    // safety: never trap the user behind the loader
    this._loadFail = setTimeout(() => { if (lo && lo.style.display !== 'none') { lo.style.display = 'none'; finish(); } }, 5000);
  }
  _bootLog() {
    const el = this._loaderLog; if (!el) return;
    const lines = ['> boot zhugez.profile', '> link  design · dev · music', '> link  ai · cybersec', '> warm  audio + shaders', '> ready ✦'];
    const msgs = ['· booting', '· linking', '· linking', '· warming up', '· ready'];
    let li = 0;
    const typeLine = () => {
      if (li >= lines.length) return;
      const full = lines[li], base = el.textContent ? el.textContent + '\n' : '';
      let ci = 0;
      const step = () => {
        ci++;
        el.textContent = base + full.slice(0, ci);
        if (this._loaderMsg && msgs[li]) this._loaderMsg.textContent = msgs[li];
        if (ci < full.length) { this._bootT = setTimeout(step, 14 + (ci % 4) * 7); }
        else { li++; this._bootT = setTimeout(typeLine, 120); }
      };
      step();
    };
    typeLine();
  }
  // ---- ⌘K command palette ----
  _commands() {
    const go = (id: string) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); this._closePalette(); };
    return [
      { id: 'theme', label: 'Toggle theme', hint: this.state.theme === 'dark' ? '→ light' : '→ dark', icon: '◐', run: () => { this.setState((s: any) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })); this._closePalette(); } },
      { id: 'music', label: this.state.playing ? 'Pause music' : 'Play music', hint: 'now playing', icon: this.state.playing ? '❚❚' : '▶', run: () => { const p = this._player; if (p) { if (this.state.playing) p.pauseVideo(); else p.playVideo(); } this._closePalette(); } },
      { id: 'copy', label: 'Copy handle', hint: this.props.handle ?? '@zhugez', icon: '⧉', run: () => { try { navigator.clipboard && navigator.clipboard.writeText(this.props.handle ?? '@zhugez'); } catch (e) {} this._closePalette(); } },
      { id: 'gear', label: 'Tech stack & setup', hint: 'gear', icon: '🛠', run: () => { this._closePalette(); this._lastFocus = document.activeElement; document.body.classList.add('dc-modal-lock'); this.setState({ gearOpen: true }); setTimeout(() => { if (this._gearClose) this._gearClose.focus(); }, 60); } },
      { id: 'accent', label: 'Accent & theme panel', hint: 'settings', icon: '✦', run: () => { this.setState((s: any) => ({ panelOpen: !s.panelOpen })); this._closePalette(); } },
      { id: 'github', label: 'Open GitHub', hint: '@zhugez', icon: '↗', run: () => { window.open('https://github.com/zhugez', '_blank', 'noopener'); this._closePalette(); } },
      { id: 'go-about', label: 'Go to · About', hint: 'section', icon: '§', run: () => go('sec-about') },
      { id: 'go-socials', label: 'Go to · Socials', hint: 'section', icon: '§', run: () => go('sec-socials') },
      { id: 'go-music', label: 'Go to · Now Playing', hint: 'section', icon: '§', run: () => go('sec-music') },
      { id: 'go-works', label: 'Go to · Recent Works', hint: 'section', icon: '§', run: () => go('sec-works') },
      { id: 'go-links', label: 'Go to · Links', hint: 'section', icon: '§', run: () => go('sec-links') }
    ];
  }
  _filtered() { const q = (this.state.paletteQuery || '').toLowerCase().trim(); const all = this._commands(); if (!q) return all; return all.filter((c) => (c.label + ' ' + c.hint).toLowerCase().indexOf(q) >= 0); }
  _openPalette() { this.setState({ paletteOpen: true, paletteQuery: '', paletteIdx: 0 }); setTimeout(() => { if (this._paletteInput) { this._paletteInput.value = ''; this._paletteInput.focus(); } }, 40); }
  _closePalette() { this.setState({ paletteOpen: false }); }
  // ---- live GitHub data ----
  _animCount(el: any, end: number) {
    if (!el) return;
    const start = parseFloat(String(el.textContent).replace(/[^0-9.]/g, '')) || 0;
    if (!window.anime) { el.textContent = end; return; }
    const obj = { v: start };
    window.anime({ targets: obj, v: end, duration: 1200, easing: 'easeOutExpo', round: 1, update: () => { el.textContent = obj.v; } });
  }
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
  // ---- WebGL aurora mesh background ----
  _hslRgb(h: number, s: number, l: number) { const a = s * Math.min(l, 1 - l); const f = (n: number) => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))); }; return [f(0), f(8), f(4)]; }
  _initAurora(cv: any) {
    if (this._rm) return; // reduced motion: keep static particle bg
    let gl: any = null;
    try { gl = cv.getContext('webgl') || cv.getContext('experimental-webgl'); } catch (e) {}
    if (!gl) return; // no WebGL: particle canvas remains the fallback
    const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}';
    const fs = [
      'precision highp float;',
      'uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse; uniform vec3 u_a; uniform vec3 u_b;',
      'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
      'float noise(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1.0,0.0)),c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));vec2 u=f*f*(3.0-2.0*f);return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;}',
      'float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=0.5;}return v;}',
      'void main(){vec2 uv=gl_FragCoord.xy/u_res.xy;vec2 p=uv;p.x*=u_res.x/u_res.y;',
      'float t=u_time*0.05;',
      'vec2 m=(u_mouse/u_res-0.5);',
      'float f=fbm(p*2.4+vec2(t,t*0.6)+m*0.7);',
      'f+=0.5*fbm(p*4.2-vec2(t*0.8,t));',
      'float band=smoothstep(0.25,1.05,f);',
      'vec3 col=mix(u_a,u_b,clamp(f*1.1,0.0,1.0));',
      'col*=band;',
      'float vig=smoothstep(1.25,0.2,length(uv-0.5));',
      'col*=vig;',
      'col+=pow(band,2.0)*0.45*u_b;',
      'float al=clamp(band*0.85,0.0,0.8);',
      'gl_FragColor=vec4(col,al);}'
    ].join('\n');
    const sh = (type: any, src: string) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res'), uTime = gl.getUniformLocation(prog, 'u_time'), uMouse = gl.getUniformLocation(prog, 'u_mouse'), uA = gl.getUniformLocation(prog, 'u_a'), uB = gl.getUniformLocation(prog, 'u_b');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => { cv.width = Math.floor(window.innerWidth * dpr); cv.height = Math.floor(window.innerHeight * dpr); gl.viewport(0, 0, cv.width, cv.height); };
    resize(); this._auroraResize = resize; window.addEventListener('resize', resize, { passive: true });
    cv.style.display = 'block'; requestAnimationFrame(() => { cv.style.opacity = '1'; });
    const start = performance.now();
    const draw = () => {
      const hue = this.state.hue;
      const a = this._hslRgb(hue / 360, 0.62, 0.42), b = this._hslRgb(((hue + 40) % 360) / 360, 0.72, 0.6);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform2f(uMouse, (this._tx || 0) * dpr, (window.innerHeight - (this._ty || 0)) * dpr);
      gl.uniform3f(uA, a[0], a[1], a[2]); gl.uniform3f(uB, b[0], b[1], b[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this._auroraRaf = requestAnimationFrame(draw);
    };
    draw();
  }
  componentWillUnmount() { clearInterval(this._clk); clearInterval(this._poll); clearTimeout(this._animT); clearTimeout(this._typeT); clearTimeout(this._loadT); clearTimeout(this._loadFail); clearTimeout(this._sfxStop); clearTimeout(this._bootT); clearInterval(this._vibeT); cancelAnimationFrame(this._raf); cancelAnimationFrame(this._pRaf); window.removeEventListener('mousemove', this._onMove); window.removeEventListener('keydown', this._onKey); window.removeEventListener('pointerover', this._onOver); clearTimeout(this._tiltT); clearTimeout(this._ghT); cancelAnimationFrame(this._vizRaf); cancelAnimationFrame(this._auroraRaf); if (this._auroraResize) window.removeEventListener('resize', this._auroraResize); if (this._onDown) window.removeEventListener('pointerdown', this._onDown, true); if (this._vizResize) window.removeEventListener('resize', this._vizResize); document.documentElement.classList.remove('dc-cursor-on'); document.body.classList.remove('dc-modal-lock'); if (this._pResize) window.removeEventListener('resize', this._pResize); }
  fmt(s: number) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60), x = Math.floor(s % 60); return m + ':' + String(x).padStart(2, '0'); }
  _initViz(cv: any) {
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const N = 36;
    const vals = new Array(N).fill(0.03), tgt = new Array(N).fill(0.03), seed = new Array(N).fill(0).map((_, i) => i * 1.73 + 0.4);
    const resize = () => { const w = cv.clientWidth, h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); cv._w = w; cv._h = h; };
    resize(); this._vizResize = resize; window.addEventListener('resize', resize);
    const css = (n: string, f: string) => { const v = getComputedStyle(this._page || document.documentElement).getPropertyValue(n).trim(); return v || f; };
    let t = 0;
    const draw = () => {
      t += 0.016;
      const playing = this.state.playing;
      const w = cv._w, h = cv._h;
      ctx.clearRect(0, 0, w, h);
      const acc = css('--accent', '#a78bfa'), acc2 = css('--accent2', '#7aa2ff');
      const bw = w / N;
      for (let i = 0; i < N; i++) {
        const bell = Math.sin((i + 0.5) / N * Math.PI);              // taller in the middle
        const s = seed[i];
        let v = (0.5 + 0.5 * Math.sin(t * 3.1 + s)) * (0.45 + 0.55 * Math.sin(t * 1.27 + s * 0.6 + Math.sin(t * 0.7)));
        v = Math.abs(v) * bell;
        tgt[i] = playing ? (0.1 + 0.9 * v) : (0.03 + 0.03 * bell);
        vals[i] += (tgt[i] - vals[i]) * (playing ? 0.32 : 0.07);
        const bh = Math.max(2, vals[i] * h);
        const x = i * bw + bw * 0.16, bwid = bw * 0.68, ry = h - bh, r = Math.min(bwid / 2, 3);
        const g = ctx.createLinearGradient(0, h, 0, ry);
        g.addColorStop(0, acc2); g.addColorStop(1, acc);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x, h); ctx.lineTo(x, ry + r); ctx.quadraticCurveTo(x, ry, x + r, ry);
        ctx.lineTo(x + bwid - r, ry); ctx.quadraticCurveTo(x + bwid, ry, x + bwid, ry + r); ctx.lineTo(x + bwid, h);
        ctx.closePath(); ctx.fill();
      }
      this._vizRaf = requestAnimationFrame(draw);
    };
    if (this._rm) { draw(); /* one organic frame, motion settles via low lerp */ } else { draw(); }
  }
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
    const ctx = canvas.getContext('2d');
    let W: number, H: number, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const COLORS = ['183,162,255', '138,178,255', '255,150,224', '150,235,255'];
    const sprites = COLORS.map((c) => this._makeSprite(c));
    let dust: any[] = [], orbs: any[] = [], stars: any[] = [], shoot: any = null, shootT = 180 + Math.random() * 240;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = W * H;
      // glowing dust motes drifting upward
      dust = Array.from({ length: Math.round(area / 16000) }, () => {
        const ci = (Math.random() * sprites.length) | 0;
        return { x: rnd(0, W), y: rnd(0, H), r: rnd(7, 20), vy: -rnd(0.05, 0.28), sway: rnd(0.2, 0.7), ph: rnd(0, 6.28), tw: rnd(0.006, 0.02), a: rnd(0.12, 0.4), ci };
      });
      // large soft bokeh orbs for depth
      orbs = Array.from({ length: Math.round(area / 150000) + 2 }, () => {
        const ci = (Math.random() * sprites.length) | 0;
        return { x: rnd(0, W), y: rnd(0, H), r: rnd(60, 150), vx: rnd(-0.08, 0.08), vy: rnd(-0.06, 0.04), ph: rnd(0, 6.28), tw: rnd(0.002, 0.006), a: rnd(0.05, 0.12), ci };
      });
      // crisp tiny twinkling stars
      stars = Array.from({ length: Math.round(area / 9000) }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.4, 1.4), ph: rnd(0, 6.28), tw: rnd(0.015, 0.05), a: rnd(0.3, 0.9) }));
    };
    resize();
    this._pResize = resize; window.addEventListener('resize', resize);
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      // bokeh orbs
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy; o.ph += o.tw;
        if (o.x < -o.r) o.x = W + o.r; if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r; if (o.y > H + o.r) o.y = -o.r;
        ctx.globalAlpha = o.a * (0.7 + 0.3 * Math.sin(o.ph));
        ctx.drawImage(sprites[o.ci], o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
      }
      // dust motes
      for (const p of dust) {
        p.y += p.vy; p.ph += p.tw; p.x += Math.sin(p.ph) * p.sway * 0.15;
        if (p.y < -p.r) { p.y = H + p.r; p.x = rnd(0, W); }
        if (p.x < -p.r) p.x = W + p.r; if (p.x > W + p.r) p.x = -p.r;
        ctx.globalAlpha = p.a * (0.55 + 0.45 * Math.sin(p.ph));
        ctx.drawImage(sprites[p.ci], p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      // twinkling stars
      for (const s of stars) {
        s.ph += s.tw;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.ph));
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
      }
      // occasional shooting star
      if (shoot) {
        shoot.x += shoot.vx; shoot.y += shoot.vy; shoot.life -= 1;
        const grad = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * 8, shoot.y - shoot.vy * 8);
        grad.addColorStop(0, 'rgba(255,255,255,' + (0.8 * Math.max(0, shoot.life / shoot.max)) + ')');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1; ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * 8, shoot.y - shoot.vy * 8); ctx.stroke();
        if (shoot.life <= 0 || shoot.x > W + 50 || shoot.y > H + 50) shoot = null;
      } else if (--shootT <= 0) {
        shootT = 420 + Math.random() * 600;
        const sp = rnd(6, 10);
        shoot = { x: rnd(0, W * 0.5), y: rnd(0, H * 0.3), vx: sp, vy: sp * rnd(0.35, 0.6), life: 60, max: 60 };
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      this._pRaf = requestAnimationFrame(draw);
    };
    draw();
  }
  clock(offsetHrs: number) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const d = new Date(utc + offsetHrs * 3600000);
    const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { t: hh + ':' + mm, d: days[d.getDay()] + ' ' + mon[d.getMonth()] + ' ' + d.getDate() };
  }
  _initYT() {
    if (this._usingSpotify) return;
    if (this._player || !this._ytEl || !(window.YT && window.YT.Player)) return;
    this._loadedId = this._videoId || 'eCkMQraVsUA';
    this._player = new window.YT.Player(this._ytEl, {
      videoId: this._loadedId,
      playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1, fs: 0 },
      events: {
        onReady: (e: any) => {
          let saved = 0; try { saved = parseFloat(localStorage.getItem(this.POS_KEY + this._loadedId)!) || 0; } catch (err) {}
          const dur = e.target.getDuration() || 0;
          if (saved > 0 && saved < dur) { e.target.seekTo(saved, true); e.target.pauseVideo(); }
          let title = ''; try { title = (e.target.getVideoData() || {}).title || ''; } catch (err) {}
          this.setState({ dur: dur, cur: saved || 0, trackTitle: title });
          this._poll = setInterval(() => {
            if (!this._player || !this._player.getCurrentTime) return;
            const c = this._player.getCurrentTime() || 0;
            this.setState({ cur: c, dur: this._player.getDuration() || this.state.dur });
            try { localStorage.setItem(this.POS_KEY + this._loadedId, String(Math.floor(c))); } catch (err) {}
          }, 500);
        },
        onStateChange: (e: any) => {
          const st = e.data;
          if (st === 1) { let title = ''; try { title = (this._player.getVideoData() || {}).title || ''; } catch (err) {} this.setState({ playing: true, trackTitle: title || this.state.trackTitle }); }
          else if (st === 2 || st === 0) this.setState({ playing: false });
          if (st === 0 && this._player) { this._player.seekTo(0, true); this._player.playVideo(); }
        }
      }
    });
  }
  _syncVideo() {
    if (this._usingSpotify || !this._player || !this._videoId) return;
    if (this._loadedId !== this._videoId) {
      this._loadedId = this._videoId;
      try { this._player.loadVideoById(this._videoId); this._player.pauseVideo(); this.setState({ cur: 0, playing: false, trackTitle: '' }); } catch (e) {}
    }
  }

  // ---- theme application (runs at mount via ref and on every render) ----
  _applyTheme(el: any) {
    if (!el) return;
    const hue = this.state.hue, h2 = (hue + 28) % 360;
    const c = 'hsl(' + hue + ' 72% 68%)', c2 = 'hsl(' + h2 + ' 80% 70%)';
    const soft = 'hsla(' + hue + ',72%,68%,.18)';
    el.setAttribute('data-theme', this.state.theme);
    el.style.setProperty('--accent', c);
    el.style.setProperty('--accent2', c2);
    el.style.setProperty('--accent-soft', soft);
    el.style.setProperty('--accent-ring', 'hsla(' + hue + ',72%,68%,.35)');
  }

  // ---- stable refs & handlers (defined once) ----
  pageRef = (el: any) => { this._page = el; this._applyTheme(el); };
  loaderRef = (el: any) => { this._loader = el; };
  sfxRef = (el: any) => { this._sfx = el; };
  loaderFillRef = (el: any) => { this._loaderFill = el; };
  loaderPctRef = (el: any) => { this._loaderPct = el; };
  loaderLogRef = (el: any) => { this._loaderLog = el; };
  loaderMsgRef = (el: any) => { this._loaderMsg = el; };
  glowRef = (el: any) => { this._glow = el; };
  curDotRef = (el: any) => { this._curDot = el; };
  curRingRef = (el: any) => { this._curRing = el; };
  rootRef = (el: any) => { this._root = el; };
  auroraRef = (el: any) => { if (el && !el._init) { el._init = true; this._initAurora(el); } };
  particleRef = (el: any) => { if (el && !el._init) { el._init = true; this._initParticles(el); } };
  vizRef = (el: any) => { if (el && !el._init) { el._init = true; this._initViz(el); } };
  ytRef = (el: any) => { this._ytEl = el; this._initYT(); };
  paletteInputRef = (el: any) => { this._paletteInput = el; };
  gearCloseRef = (el: any) => { this._gearClose = el; };
  imgSrcRef = (el: any) => {
    if (!el) return;
    const s = el.getAttribute('data-src') || '';
    if (s && s.indexOf('{{') < 0 && el.src !== s) { el.src = s; }
  };
  worksGridRef = (el: any) => {
    if (!el || el._scanBound) return; el._scanBound = true;
    const setMask = (cell: any, x: number, y: number) => { const c = cell.querySelector('[data-color]'); if (c) { const m = 'radial-gradient(circle 85px at ' + x + 'px ' + y + 'px,#000 0,#000 55%,transparent 78%)'; c.style.webkitMaskImage = m; c.style.maskImage = m; } };
    const clearMask = (cell: any) => { const c = cell.querySelector('[data-color]'); if (c) { const m = 'radial-gradient(circle 0px at 50% 50%,#000 0,transparent 0)'; c.style.webkitMaskImage = m; c.style.maskImage = m; } };
    el.addEventListener('mousemove', (e: any) => { const cell = e.target.closest('.work-cell'); if (!cell || !el.contains(cell)) return; const r = cell.getBoundingClientRect(); setMask(cell, e.clientX - r.left, e.clientY - r.top); });
    el.addEventListener('mouseleave', () => { el.querySelectorAll('.work-cell').forEach(clearMask); }, true);
    el.addEventListener('mouseout', (e: any) => { const cell = e.target.closest('.work-cell'); if (cell && !cell.contains(e.relatedTarget)) clearMask(cell); });
  };
  coverRef = (el: any) => {
    if (!el || this._usingSpotify || !this._videoId) return;
    const url = 'https://img.youtube.com/vi/' + this._videoId + '/hqdefault.jpg';
    if (el.dataset.cv !== url) { el.dataset.cv = url; el.style.backgroundImage = 'url(' + url + ')'; }
  };
  spotifyRef = (el: any) => {
    if (!el || !this._spM) return;
    const type = this._spM[1] || 'playlist', id = this._spM[2];
    const url = 'https://open.spotify.com/embed/' + type + '/' + id + '?utm_source=generator&theme=0';
    if (el.dataset.curSrc !== url) { el.dataset.curSrc = url; el.src = url; }
  };
  onCopy = () => { try { navigator.clipboard && navigator.clipboard.writeText(this.props.handle ?? '@zhugez'); } catch (e) {} };
  closeModal = () => this.setState({ modalIndex: null });
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
  onToggle = () => { const p = this._player; if (!p) return; if (this.state.playing) { p.pauseVideo(); } else { p.playVideo(); } };
  onSeek = (e: any) => { const p = this._player; if (!p || !this.state.dur) return; const r = e.currentTarget.getBoundingClientRect(); const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); const t = f * this.state.dur; p.seekTo(t, true); this.setState({ cur: t }); };
  onMute = () => { const p = this._player; if (!p) return; if (p.isMuted()) { p.unMute(); this.setState({ muted: false }); } else { p.mute(); this.setState({ muted: true }); } };

  render() {
    const frac = this.state.dur ? Math.min(1, this.state.cur / this.state.dur) : 0;
    const hue = this.state.hue;
    const h2 = (hue + 28) % 360;
    const acc = {
      c: 'hsl(' + hue + ' 72% 68%)', c2: 'hsl(' + h2 + ' 80% 70%)',
      soft: 'hsla(' + hue + ',72%,68%,.18)', glow: 'hsla(' + hue + ',80%,65%,.45)'
    };
    const pal = { p: acc.c, ring: 'conic-gradient(from 0deg,' + acc.c + ',' + acc.c2 + ',' + acc.c + ')' };
    this._applyTheme(this._page);
    // ---- music source parsing (YouTube custom player OR Spotify embed) ----
    const musicRaw = (this.props.music || 'eCkMQraVsUA').trim();
    const spM = musicRaw.match(/open\.spotify\.com\/(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/) ||
      (musicRaw.indexOf('spotify:') === 0 ? (function () { const p = musicRaw.split(':'); return p.length >= 3 ? [null, p[1], p[2]] : null; })() : null);
    const usingSpotify = !!spM;
    let videoId = '';
    if (!usingSpotify) {
      const ym = musicRaw.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/|\/v\/)([A-Za-z0-9_-]{11})/);
      videoId = ym ? ym[1] : musicRaw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 11);
    }
    this._usingSpotify = usingSpotify;
    this._videoId = videoId;
    this._spM = spM;
    this._syncVideo();
    const rawWorks = (typeof window !== 'undefined' && window.ARISE_WORKS) ? window.ARISE_WORKS : [];
    const WTITLES = [['ShadowForge', 'web app'], ['InnisAgent', 'AI · exams'], ['Codexible', 'platform']];
    const works = rawWorks.map((src: string, i: number) => ({ src, title: WTITLES[i % WTITLES.length][0], meta: WTITLES[i % WTITLES.length][1], open: () => this.setState({ modalIndex: i }) }));
    const modalSrc = (this.state.modalIndex != null && rawWorks[this.state.modalIndex]) || '';
    const gear = [
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
    const artistName = this.props.artistName ?? 'Ly Ngoc Vu';
    const handle = this.props.handle ?? '@zhugez';
    const statusText = this.state.typed;
    const vibe = this._vibe();
    const vibeWord = vibe[0], vibeSub = vibe[1];
    const aboutText = this.props.aboutText ?? 'Designer, developer & music producer — building web apps, AI tools and audio, with a soft spot for cybersec. Turning ideas into things you can see, hear and use.';
    const clocks = [
      Object.assign({ label: 'VN' }, this.clock(7)),
      Object.assign({ label: 'FR' }, this.clock(2)),
      Object.assign({ label: 'US' }, this.clock(-4))
    ];
    const ringStyle = { width: '80px', height: '80px', borderRadius: '50%', padding: '3px', background: pal.ring, boxShadow: '0 6px 20px rgba(0,0,0,.4),0 0 22px ' + acc.glow, animation: 'pf-spin 7s linear infinite' };
    const nameStyle = { fontFamily: "'Zen Kaku Gothic New',sans-serif", fontWeight: 900, fontSize: '22px', lineHeight: 1, color: 'var(--t1)', textShadow: '0 0 18px ' + acc.glow };
    const cursorStyle = { display: 'inline-block', width: '7px', height: '13px', background: pal.p, borderRadius: '1px', animation: 'pf-blink 1.1s steps(1) infinite' };
    const usingYouTube = !usingSpotify;
    const trackTitle = this.state.trackTitle;
    const coverAnim = this.state.playing ? '' : 'animation-play-state:paused;';
    const hueLabel = hue + '°';
    const playing = this.state.playing, paused = !this.state.playing, muted = this.state.muted, unmuted = !this.state.muted;
    const nowLabel = playing ? 'now playing' : 'paused';
    const curLabel = this.fmt(this.state.cur), durLabel = this.fmt(this.state.dur);
    const progFillStyle = { height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg,' + acc.c + ',' + acc.c2 + ')', width: '100%', transformOrigin: 'left', transform: 'scaleX(' + frac + ')', transition: 'transform .2s linear' };
    const panelOpen = this.state.panelOpen, gearOpen = this.state.gearOpen, paletteOpen = this.state.paletteOpen;
    const btnFlex = { fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', fontWeight: 600, cursor: 'pointer', borderRadius: '10px', padding: '8px 0', flex: 1, transition: '.15s' };
    const darkBtnStyle = Object.assign({}, btnFlex, this.state.theme === 'dark' ? { border: '1px solid ' + acc.c, background: acc.soft, color: 'var(--t1)' } : { border: '1px solid var(--bd)', background: 'transparent', color: 'var(--t2)' });
    const lightBtnStyle = Object.assign({}, btnFlex, this.state.theme === 'light' ? { border: '1px solid ' + acc.c, background: acc.soft, color: 'var(--t1)' } : { border: '1px solid var(--bd)', background: 'transparent', color: 'var(--t2)' });
    const pIdx = this.state.paletteIdx || 0;
    const baseRow = 'display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;cursor:pointer;border:1px solid transparent;';
    const onRow = baseRow + 'background:var(--accent-soft,rgba(167,139,250,.16));border-color:var(--accent);';
    const paletteList = this._filtered().map((c, i) => ({
      label: c.label, hint: c.hint, icon: c.icon,
      rowStyle: i === pIdx ? onRow : baseRow,
      run: (ev: any) => { if (ev && ev.stopPropagation) ev.stopPropagation(); if (c.run) c.run(); }
    }));
    const paletteEmpty = this.state.paletteOpen && this._filtered().length === 0;

    return (
      <div ref={this.pageRef} style="position:relative;min-height:100vh;overflow:hidden;background:radial-gradient(700px circle at 16% 12%,rgba(167,139,250,.26),transparent 56%),radial-gradient(680px circle at 88% 18%,rgba(122,162,255,.20),transparent 56%),radial-gradient(760px circle at 60% 108%,rgba(255,122,217,.13),transparent 58%),var(--bg);padding:clamp(18px,3vw,40px) 16px;font-family:'Hanken Grotesk',sans-serif;">

        <div ref={this.loaderRef} style="position:fixed;inset:0;z-index:90;overflow:hidden;background:radial-gradient(720px circle at 50% 38%,rgba(167,139,250,.13),transparent 60%),#070a15;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;">
          <audio ref={this.sfxRef} src="media/konichiwa.mp3" preload="auto"></audio>
          <div style="position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.022) 0,rgba(255,255,255,.022) 1px,transparent 1px,transparent 3px);animation:pf-scan 7s linear infinite;opacity:.6;"></div>
          <div style="position:relative;width:132px;height:132px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:132px;height:132px;border-radius:50%;background:conic-gradient(from 0deg,var(--accent),var(--accent2),transparent 72%);animation:pf-spin 1.3s linear infinite;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 3px));mask:radial-gradient(farthest-side,transparent calc(100% - 3px),#000 calc(100% - 3px));opacity:.65;"></div>
            <div style="position:absolute;width:118px;height:118px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,.32),transparent 68%);filter:blur(9px);animation:pf-twinkle 2.6s ease-in-out infinite;"></div>
            <img src="media/loader-icon.png" alt="" width="98" height="98" style="position:relative;width:98px;height:98px;object-fit:contain;filter:drop-shadow(0 0 14px rgba(122,162,255,.55));animation:pf-bob 3s ease-in-out infinite;" />
          </div>
          <div style="font-family:'Zen Kaku Gothic New',sans-serif;font-weight:900;font-size:2.125rem;letter-spacing:.34em;padding-left:.34em;background:linear-gradient(90deg,var(--accent),var(--accent2),#fff,var(--accent2),var(--accent));background-size:220% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;filter:drop-shadow(0 0 18px rgba(167,139,250,.45));animation:pf-shimmer 2.6s linear infinite;">ZhugeZ</div>
          <div ref={this.loaderLogRef} style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;line-height:1.75;color:var(--t3);width:min(82vw,308px);min-height:76px;text-align:left;white-space:pre-wrap;"></div>
          <div style="width:min(82vw,240px);height:5px;border-radius:99px;background:rgba(130,150,210,.18);overflow:hidden;">
            <div ref={this.loaderFillRef} style="height:100%;width:0%;border-radius:99px;background:linear-gradient(90deg,var(--accent),var(--accent2));box-shadow:0 0 12px var(--accent);"></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.16em;color:var(--t3);text-transform:uppercase;">
            <span ref={this.loaderPctRef} style="color:var(--accent2);">0%</span><span ref={this.loaderMsgRef}>· booting</span>
          </div>
        </div>

        <div ref={this.glowRef} style="position:fixed;left:0;top:0;width:440px;height:440px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,.20),rgba(122,162,255,.10) 45%,transparent 70%);pointer-events:none;z-index:0;transform:translate(-50%,-50%);filter:blur(22px);will-change:transform;"></div>

        <canvas ref={this.auroraRef} aria-hidden="true" style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;display:none;opacity:.0;transition:opacity 1.2s ease;"></canvas>
        <canvas ref={this.particleRef} style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;"></canvas>

        <div id="dcCurRing" class="dc-cursor" ref={this.curRingRef}></div>
        <div id="dcCurDot" class="dc-cursor" ref={this.curDotRef}></div>

        <div ref={this.rootRef} style="position:relative;z-index:1;width:100%;max-width:968px;margin:0 auto;display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;">

          {/* ============ LEFT COLUMN ============ */}
          <div style="flex:1 1 296px;min-width:280px;max-width:322px;display:flex;flex-direction:column;gap:18px;">

            {/* profile card */}
            <div style="background:var(--card);border:1px solid var(--bd);border-radius:16px;overflow:hidden;">
              <div style="position:relative;height:96px;overflow:hidden;background:linear-gradient(135deg,#1a1340,#13213f);">
                <img src="media/banner.gif" alt="banner" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 56%;display:block;" />
              </div>
              <div style="padding:0 16px 16px;position:relative;">
                <div style="position:absolute;width:150px;height:150px;right:-30px;bottom:-30px;border-radius:50%;background:radial-gradient(circle,var(--accent),transparent 65%);opacity:.14;filter:blur(16px);animation:pf-aurora 12s ease-in-out infinite;pointer-events:none;"></div>
                <div style="position:absolute;width:120px;height:120px;left:-20px;bottom:20px;border-radius:50%;background:radial-gradient(circle,var(--accent2),transparent 65%);opacity:.10;filter:blur(16px);animation:pf-aurora2 14s ease-in-out infinite;pointer-events:none;"></div>
                <div style="display:flex;align-items:flex-end;gap:12px;margin-top:-34px;">
                  <div style="position:relative;flex:none;">
                    <div style={ringStyle}>
                      <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;background:var(--card);border:3px solid var(--card);animation:pf-spinr 7s linear infinite;">
                        <img src="media/avatar.gif" alt="avatar" style="width:100%;height:100%;object-fit:cover;display:block;" />
                      </div>
                    </div>
                    <span style="position:absolute;right:3px;bottom:3px;width:16px;height:16px;border-radius:50%;background:#43d17a;border:3px solid var(--card);animation:pf-pip 2.4s infinite;z-index:2;"></span>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:10px;">
                  <span style={nameStyle}>{artistName}</span>
                  <span style="font-size:0.8125rem;color:#c9b6ff;display:inline-block;animation:pf-twinkle 2.6s ease-in-out infinite;">✦</span>
                </div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem;color:var(--t2);margin-top:3px;cursor:pointer;" onClick={this.onCopy} title="copy handle">{handle} · <span style="color:var(--t4);">#0001</span></div>

                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:13px;">
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:#b9a8f5;background:rgba(167,139,250,.12);border:1px solid rgba(167,139,250,.3);padding:3px 9px;border-radius:8px;">◆ Designer</span>
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:#9fc0f5;background:rgba(122,162,255,.12);border:1px solid rgba(122,162,255,.3);padding:3px 9px;border-radius:8px;">✦ Developer</span>
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:#ffcf6b;background:rgba(255,207,107,.1);border:1px solid rgba(255,207,107,.28);padding:3px 9px;border-radius:8px;">♪ Producer</span>
                  <span style="display:inline-flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:#ff9ed6;background:rgba(255,122,217,.1);border:1px solid rgba(255,122,217,.28);padding:3px 9px;border-radius:8px;">🛡 Security</span>
                </div>

                <div style="margin-top:12px;display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid var(--bd);border-radius:10px;padding:7px 11px;">
                  <span style="font-size:0.75rem;">🎨</span>
                  <span style="font-size:0.75rem;color:var(--t2);">{statusText}</span>
                  <span style={cursorStyle}></span>
                </div>
                <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);margin-top:11px;">Joined since 2024</div>
              </div>
            </div>

            {/* current activity */}
            <div style="background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="width:4px;height:13px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.14em;color:var(--t3);text-transform:uppercase;">current activity</span></div>
              <div style="display:flex;align-items:center;gap:12px;">
                <div style="flex:none;width:42px;height:42px;border-radius:10px;background:linear-gradient(150deg,#3a1d6e,var(--accent2));display:flex;align-items:center;justify-content:center;color:#fff;"><svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.15 2.587 18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" /></svg></div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:0.875rem;color:var(--t1);font-weight:600;">VS Code</div>
                  <div style="font-size:0.75rem;color:var(--t2);">building · 2 hrs 14 min elapsed</div>
                </div>
                <div style="display:flex;gap:3px;flex:none;">
                  <span style="width:5px;height:5px;border-radius:50%;background:var(--accent);animation:pf-dots 1.4s infinite;"></span>
                  <span style="width:5px;height:5px;border-radius:50%;background:var(--accent);animation:pf-dots 1.4s infinite .2s;"></span>
                  <span style="width:5px;height:5px;border-radius:50%;background:var(--accent);animation:pf-dots 1.4s infinite .4s;"></span>
                </div>
              </div>
            </div>

            {/* world clock */}
            <div style="background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="width:4px;height:13px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.14em;color:var(--t3);text-transform:uppercase;">world clock</span></div>
              <div style="display:flex;gap:8px;">
                {clocks.map((c, i) => (
                  <div key={i} style="flex:1;background:var(--panel);border:1px solid var(--bd2);border-radius:10px;padding:9px 4px;text-align:center;">
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.1em;color:var(--t3);">{c.label}</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:1rem;color:#c9b6ff;margin-top:3px;letter-spacing:.01em;">{c.t}</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);margin-top:2px;">{c.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* stats */}
            <div style="background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="width:4px;height:13px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.14em;color:var(--t3);text-transform:uppercase;">stats</span></div>
              <div style="display:flex;gap:8px;">
                <div style="flex:1;background:var(--panel);border:1px solid var(--bd2);border-radius:10px;padding:11px 4px;text-align:center;">
                  <div data-count="42" data-gh="repos" style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:1.25rem;color:var(--t1);">42</div>
                  <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.08em;color:var(--t3);margin-top:3px;">REPOS</div>
                </div>
                <div style="flex:1;background:var(--panel);border:1px solid var(--bd2);border-radius:10px;padding:11px 4px;text-align:center;">
                  <div data-count="21" data-gh="followers" style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:1.25rem;color:var(--t1);">21</div>
                  <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.08em;color:var(--t3);margin-top:3px;">FOLLOWERS</div>
                </div>
                <div style="flex:1;background:var(--panel);border:1px solid var(--bd2);border-radius:10px;padding:11px 4px;text-align:center;">
                  <div data-count="28" data-gh="stars" style="font-family:'JetBrains Mono',monospace;font-weight:700;font-size:1.25rem;color:var(--t1);">28</div>
                  <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.08em;color:var(--t3);margin-top:3px;">STARS</div>
                </div>
              </div>
            </div>

            {/* vibe / vinyl */}
            <div style="position:relative;overflow:hidden;background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px;">
              <div style="position:absolute;width:160px;height:160px;left:-30px;bottom:-50px;border-radius:50%;background:radial-gradient(circle,var(--accent),transparent 65%);opacity:.22;filter:blur(14px);animation:pf-aurora 11s ease-in-out infinite;pointer-events:none;"></div>
              <div style="position:absolute;width:150px;height:150px;right:-30px;top:-40px;border-radius:50%;background:radial-gradient(circle,var(--accent2),transparent 65%);opacity:.18;filter:blur(14px);animation:pf-aurora2 13s ease-in-out infinite;pointer-events:none;"></div>
              <div style="position:relative;display:flex;align-items:center;gap:8px;margin-bottom:14px;"><span style="width:4px;height:13px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.14em;color:var(--t3);text-transform:uppercase;">vibe</span></div>
              <div style="position:relative;display:flex;align-items:center;gap:16px;">
                <div style="flex:none;width:74px;height:74px;border-radius:50%;background:repeating-radial-gradient(circle at 50% 50%,#15151c 0,#15151c 2px,#0c0c12 2px,#0c0c12 4px);box-shadow:0 4px 16px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;animation:pf-spin 4s linear infinite;">
                  <div style="width:30px;height:30px;border-radius:50%;background:conic-gradient(from 0deg,var(--accent),var(--accent2),var(--accent));display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px var(--accent-soft,transparent);">
                    <div style="width:7px;height:7px;border-radius:50%;background:var(--card);"></div>
                  </div>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:0.875rem;color:var(--t1);font-weight:600;">{vibeWord}</div>
                  <div style="font-size:0.75rem;color:var(--t2);margin-top:2px;">{vibeSub}</div>
                  <div style="display:flex;align-items:flex-end;gap:3px;height:16px;margin-top:9px;">
                    <span style="flex:1;background:linear-gradient(var(--accent2),var(--accent));border-radius:2px;transform-origin:bottom;animation:pf-eq 1.1s ease-in-out infinite;"></span>
                    <span style="flex:1;background:linear-gradient(var(--accent2),var(--accent));border-radius:2px;transform-origin:bottom;animation:pf-eq 1.1s ease-in-out infinite .15s;"></span>
                    <span style="flex:1;background:linear-gradient(var(--accent2),var(--accent));border-radius:2px;transform-origin:bottom;animation:pf-eq 1.1s ease-in-out infinite .3s;"></span>
                    <span style="flex:1;background:linear-gradient(var(--accent2),var(--accent));border-radius:2px;transform-origin:bottom;animation:pf-eq 1.1s ease-in-out infinite .45s;"></span>
                    <span style="flex:1;background:linear-gradient(var(--accent2),var(--accent));border-radius:2px;transform-origin:bottom;animation:pf-eq 1.1s ease-in-out infinite .6s;"></span>
                    <span style="flex:1;background:linear-gradient(var(--accent2),var(--accent));border-radius:2px;transform-origin:bottom;animation:pf-eq 1.1s ease-in-out infinite .75s;"></span>
                    <span style="flex:1;background:linear-gradient(var(--accent2),var(--accent));border-radius:2px;transform-origin:bottom;animation:pf-eq 1.1s ease-in-out infinite .9s;"></span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ============ RIGHT COLUMN ============ */}
          <div style="flex:3 1 380px;min-width:320px;display:flex;flex-direction:column;gap:18px;">

            {/* about me */}
            <div id="sec-about" style="background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px;scroll-margin-top:18px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:13px;"><span style="width:4px;height:13px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.14em;color:var(--t3);text-transform:uppercase;">about me</span></div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:15px;">
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#b9a8f5;background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.24);padding:4px 11px;border-radius:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z" /><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18" /><path d="m2.3 2.3 7.286 7.286" /><circle cx="11" cy="11" r="2" /></svg>Design</span>
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#9fc0f5;background:rgba(122,162,255,.1);border:1px solid rgba(122,162,255,.24);padding:4px 11px;border-radius:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>Dev</span>
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#9ff0d0;background:rgba(67,209,122,.1);border:1px solid rgba(67,209,122,.24);padding:4px 11px;border-radius:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>Music</span>
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#ff9ed6;background:rgba(255,122,217,.1);border:1px solid rgba(255,122,217,.24);padding:4px 11px;border-radius:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" /></svg>AI</span>
                <span style="display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#ffd79a;background:rgba(255,207,107,.1);border:1px solid rgba(255,207,107,.24);padding:4px 11px;border-radius:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>Cyber</span>
              </div>
              <div style="font-family:'JetBrains Mono',monospace;font-size:0.8125rem;color:var(--accent2);margin-bottom:8px;">&gt; currently shipping side projects...</div>
              <p style="margin:0;font-size:0.875rem;line-height:1.7;color:var(--t2);">{aboutText}</p>
              <p style="margin:10px 0 0;font-size:0.875rem;line-height:1.7;color:var(--t2);">dm me if u wanna talk about <span style="color:#c9b6ff;font-weight:600;">design, music, code or AI</span> :)</p>
            </div>

            {/* socials */}
            <div id="sec-socials" style="background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px;scroll-margin-top:18px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:13px;"><span style="width:4px;height:13px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.14em;color:var(--t3);text-transform:uppercase;">socials</span></div>
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
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(167,139,250,.14);display:flex;align-items:center;justify-content:center;color:#b9a8f5;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">Portfolio</span>
                </a>
                <a class="soc" href="mailto:dezzhuge@gmail.com" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" style-hover="border-color:#43d17a;transform:translateY(-3px);box-shadow:0 0 20px rgba(67,209,122,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(67,209,122,.14);display:flex;align-items:center;justify-content:center;color:#9ff0d0;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">Email</span>
                </a>
              </div>
            </div>

            {/* now playing (custom player) */}
            <div id="sec-music" style="position:relative;background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px;scroll-margin-top:18px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:8px;"><span style="width:4px;height:13px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.14em;color:var(--t3);text-transform:uppercase;">{nowLabel}</span></div>
                <div style="display:flex;align-items:flex-end;gap:3px;height:14px;">
                  <span style="width:3px;height:100%;background:var(--accent);border-radius:2px;transform-origin:bottom;animation:pf-eq .9s ease-in-out infinite;"></span>
                  <span style="width:3px;height:100%;background:var(--accent2);border-radius:2px;transform-origin:bottom;animation:pf-eq .9s ease-in-out infinite .3s;"></span>
                  <span style="width:3px;height:100%;background:var(--accent);border-radius:2px;transform-origin:bottom;animation:pf-eq .9s ease-in-out infinite .6s;"></span>
                </div>
              </div>

              <div ref={this.ytRef} style="position:absolute;width:1px;height:1px;left:-9999px;top:0;opacity:0;pointer-events:none;"></div>

              {usingSpotify && (
                <div style="position:relative;border-radius:16px;overflow:hidden;background:linear-gradient(160deg,var(--panel),#0a0f1f);border:1px solid var(--bd);box-shadow:0 0 0 1px var(--accent-ring,transparent),0 8px 22px rgba(0,0,0,.35),0 0 22px var(--accent-soft,transparent);">
                  <div style="height:3px;background:linear-gradient(90deg,var(--accent),var(--accent2),var(--accent));"></div>
                  <div style="padding:8px 8px 0;">
                    <iframe ref={this.spotifyRef} title="Spotify playlist" style="width:100%;height:152px;border:0;display:block;border-radius:10px;" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px 10px;">
                    <span style="display:flex;align-items:center;gap:6px;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.1em;color:var(--t3);text-transform:uppercase;"><span style="width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);"></span>streaming on spotify</span>
                    <span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--accent2);">lofi · ambient</span>
                  </div>
                </div>
              )}

              {usingYouTube && (
                <>
                  <div style="display:flex;align-items:center;gap:16px;">
                    <div style="position:relative;flex:none;width:62px;height:62px;">
                      <div ref={this.coverRef} style={`width:100%;height:100%;border-radius:50%;background-color:#0c0c12;background-size:cover;background-position:center;box-shadow:0 4px 16px rgba(0,0,0,.5),0 0 0 3px rgba(0,0,0,.4),0 0 0 4px var(--accent-ring,transparent);animation:pf-spin 8s linear infinite;${coverAnim}`}></div>
                      <div style="position:absolute;left:50%;top:50%;width:14px;height:14px;border-radius:50%;background:var(--card);transform:translate(-50%,-50%);box-shadow:inset 0 0 0 2px var(--accent);"></div>
                    </div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:1rem;color:var(--t1);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{trackTitle}</div>
                      <div style="font-size:0.75rem;color:var(--t2);margin-top:1px;">via YouTube · lofi</div>
                    </div>
                    <button type="button" class="play-btn mag" onClick={this.onToggle} aria-label="Play or pause" style="flex:none;width:48px;height:48px;border:none;cursor:pointer;border-radius:50%;background:linear-gradient(150deg,var(--accent),var(--accent2));color:#fff;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px var(--accent-soft,rgba(122,162,255,.4));transition:transform .15s;" style-hover="transform:scale(1.08);">{playing && <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>}{paused && <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-left:2px;"><path d="M8 5v14l11-7z"></path></svg>}</button>
                  </div>
                  <canvas ref={this.vizRef} style="width:100%;height:30px;display:block;margin-top:14px;"></canvas>
                  <div style="display:flex;align-items:center;gap:10px;margin-top:12px;">
                    <span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);min-width:32px;">{curLabel}</span>
                    <div onClick={this.onSeek} style="flex:1;height:6px;border-radius:99px;background:rgba(130,150,210,.18);overflow:hidden;cursor:pointer;">
                      <div style={progFillStyle}></div>
                    </div>
                    <span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);min-width:32px;text-align:right;">{durLabel}</span>
                    <button type="button" onClick={this.onMute} aria-label="Mute" style="background:none;border:none;cursor:pointer;color:var(--t3);width:44px;height:44px;padding:0;line-height:0;display:flex;align-items:center;justify-content:center;" style-hover="color:var(--t1);">{unmuted && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a7 7 0 0 1 0 14.14"></path></svg>}{muted && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>}</button>
                  </div>
                </>
              )}
            </div>

            {/* recent works */}
            <div id="sec-works" style="background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px;scroll-margin-top:18px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;">
                <div style="display:flex;align-items:center;gap:8px;"><span style="width:4px;height:13px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.14em;color:var(--t3);text-transform:uppercase;">recent works</span></div>
                <a href="#" style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--accent2);text-decoration:none;">view all →</a>
              </div>
              <div ref={this.worksGridRef} style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
                {works.map((w, i) => (
                  <div key={i} class="work-cell" onDblClick={w.open} title="double-click to enlarge" style="position:relative;height:104px;border-radius:12px;overflow:hidden;cursor:zoom-in;border:1px solid var(--bd);">
                    <img ref={this.imgSrcRef} data-src={w.src} alt="work" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:grayscale(1) brightness(.82);" />
                    <img data-color="1" ref={this.imgSrcRef} data-src={w.src} alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;-webkit-mask-image:radial-gradient(circle 0px at 50% 50%,#000 0,transparent 0);mask-image:radial-gradient(circle 0px at 50% 50%,#000 0,transparent 0);" />
                    <span style="position:absolute;top:6px;right:6px;font-size:0.6875rem;color:#fff;background:rgba(10,15,31,.6);border-radius:8px;padding:2px 5px;line-height:1;pointer-events:none;">⤢</span>
                    <div class="work-cap" style="position:absolute;left:0;right:0;bottom:0;padding:14px 9px 7px;background:linear-gradient(transparent,rgba(20,10,40,.92));pointer-events:none;">
                      <div style="font-size:0.6875rem;color:#fff;font-weight:600;line-height:1.2;">{w.title}</div>
                      <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--accent2);margin-top:2px;">{w.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* links */}
            <div id="sec-links" style="background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px;scroll-margin-top:18px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:13px;"><span style="width:4px;height:13px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.14em;color:var(--t3);text-transform:uppercase;">links</span></div>
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

            <div style="text-align:center;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);padding:4px 0 6px;">© 2026 zhugez · made with neon & coffee</div>

          </div>
        </div>

        <button type="button" class="mag" onClick={this.openPalette} aria-label="Open command palette" style="position:fixed;left:18px;bottom:18px;z-index:55;display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;border:1px solid var(--bd);border-radius:99px;background:var(--card);color:var(--t2);cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4);font-family:'JetBrains Mono',monospace;font-size:0.75rem;transition:transform .15s,border-color .15s,color .15s;" style-hover="transform:translateY(-2px);border-color:var(--accent);color:var(--t1);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          <span style="display:flex;align-items:center;gap:3px;"><kbd style="font-family:inherit;background:var(--panel);border:1px solid var(--bd2);border-radius:5px;padding:1px 5px;font-size:0.6875rem;color:var(--t3);">⌘</kbd><kbd style="font-family:inherit;background:var(--panel);border:1px solid var(--bd2);border-radius:5px;padding:1px 5px;font-size:0.6875rem;color:var(--t3);">K</kbd></span>
        </button>

        <div style="position:fixed;right:18px;bottom:18px;z-index:55;display:flex;flex-direction:column;align-items:flex-end;gap:10px;">
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

        <div style="position:fixed;right:20px;top:14px;z-index:54;cursor:pointer;transition:transform .2s ease;" style-hover="transform:scale(1.06) rotate(2deg);" title="hi!">
          <div style="position:relative;width:132px;height:132px;animation:pf-bob 4s ease-in-out infinite;filter:drop-shadow(0 8px 16px rgba(0,0,0,.4));">
            <img src="media/mascot-cut.png" alt="mascot" style="width:100%;height:100%;object-fit:contain;display:block;" />
            <div style="position:absolute;top:-6px;left:-16px;background:var(--accent);color:#0a0f1f;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;font-weight:700;padding:3px 9px;border-radius:10px;transform:rotate(-6deg);box-shadow:0 3px 8px rgba(0,0,0,.35);white-space:nowrap;">hi! ✦</div>
          </div>
        </div>

        {modalSrc && (
          <div onClick={this.closeModal} role="dialog" aria-modal="true" aria-label="Work detail" style="position:fixed;inset:0;z-index:60;background:rgba(4,6,15,.86);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:28px;cursor:zoom-out;">
            <img ref={this.imgSrcRef} data-src={modalSrc} alt="artwork" style="max-width:90vw;max-height:86vh;border-radius:16px;border:1px solid rgba(167,139,250,.45);box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 60px rgba(167,139,250,.3);" />
          </div>
        )}

        {gearOpen && (
          <div onClick={this.closeGear} role="dialog" aria-modal="true" aria-label="Gear and setup" style="position:fixed;inset:0;z-index:62;background:rgba(4,6,15,.86);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:24px;">
            <div onClick={this.stop} style="width:100%;max-width:min(94vw,920px);max-height:90vh;background:var(--card);border:1px solid var(--bd);border-radius:16px;box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 60px var(--accent-soft,rgba(167,139,250,.3));">
              <div style="position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;padding:15px 18px;background:var(--card);border-bottom:1px solid var(--bd);z-index:1;">
                <div style="display:flex;align-items:center;gap:8px;"><span style="width:4px;height:14px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;letter-spacing:.14em;color:var(--t2);text-transform:uppercase;">gear & setup</span></div>
                <button type="button" ref={this.gearCloseRef} onClick={this.closeGear} aria-label="Close" style="width:44px;height:44px;border-radius:10px;border:1px solid var(--bd);background:var(--panel);color:var(--t2);cursor:pointer;font-size:0.9375rem;line-height:1;display:flex;align-items:center;justify-content:center;">✕</button>
              </div>
              <div class="gear-grid" style="display:grid;grid-auto-flow:column;grid-template-rows:repeat(3,1fr);grid-auto-columns:192px;gap:12px;overflow-x:auto;overflow-y:hidden;padding:16px 18px 20px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;">
                {gear.map((g, i) => (
                  <div key={i} style="scroll-snap-align:start;display:flex;flex-direction:column;gap:8px;background:var(--panel);border:1px solid var(--bd2);border-radius:12px;padding:13px 14px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <div style="flex:none;width:40px;height:40px;border-radius:10px;background:rgba(167,139,250,.12);display:flex;align-items:center;justify-content:center;font-size:1.25rem;">{g.ic}</div>
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
          <div onClick={this.closePalette} role="dialog" aria-modal="true" aria-label="Command palette" style="position:fixed;inset:0;z-index:80;background:rgba(4,6,15,.7);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:flex-start;justify-content:center;padding:14vh 20px 20px;">
            <div onClick={this.paletteStop} style="width:100%;max-width:560px;background:var(--card);border:1px solid var(--bd);border-radius:16px;box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 60px var(--accent-soft,rgba(167,139,250,.3));overflow:hidden;">
              <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--bd);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                <input ref={this.paletteInputRef} onInput={this.onPaletteInput} type="text" placeholder="Type a command or jump to…" aria-label="Command palette search" autocomplete="off" spellcheck={false} style="flex:1;background:none;border:none;outline:none;color:var(--t1);font-family:'Hanken Grotesk',sans-serif;font-size:1rem;min-width:0;" />
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);border:1px solid var(--bd);border-radius:6px;padding:2px 6px;">esc</span>
              </div>
              <div style="max-height:46vh;overflow:auto;padding:8px;">
                {paletteList.map((cmd, i) => (
                  <div key={i} class="cmd-row" onClick={cmd.run} style={cmd.rowStyle}>
                    <span style="flex:none;width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:0.875rem;background:var(--accent-soft,rgba(167,139,250,.16));color:var(--accent2);">{cmd.icon}</span>
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
