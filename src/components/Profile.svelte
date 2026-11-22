<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import Rise from './Rise.svelte';
  import PlaybackIcon from './PlaybackIcon.svelte';
  import Modal from './Modal.svelte';
  import { ProfileRuntime, createProfileState, MAKE, STEPS, type ProfileProps } from './profile-runtime';
  let props: ProfileProps = $props();
  const state = $state(createProfileState());
  const runtime = new ProfileRuntime(state, () => props);
  const v = $derived(runtime.view());
  const style = (value: string | Record<string, string | number>) => typeof value === 'string' ? value : Object.entries(value).map(([key, value]) => key.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase()) + ':' + value).join(';');
  $effect(() => runtime._applyTheme(runtime._page));
  onMount(() => { runtime.mount(); return () => runtime.dispose(); });
</script>

<div {@attach (element) => { untrack(() => runtime.pageRef(element)); }} class="page">

        <audio {@attach (element) => { untrack(() => runtime.sfxRef(element)); }} src="media/konichiwa.mp3" preload="auto"></audio>
        {#if v.boot < 2}<div class="boot" style={style(v.boot ? 'opacity:0;pointer-events:none;' : '')}></div>{/if}

        <canvas {@attach (element) => { untrack(() => runtime.auroraRef(element)); }} class="aurora" aria-hidden="true"></canvas>
        <picture class="scene" aria-hidden="true">
          <source media="(prefers-reduced-motion: reduce)" srcset="media/scene-still.webp" />
          <img src="media/scene.webp" alt="" />
        </picture>
        <div class="scrim"></div>
        <canvas {@attach (element) => { untrack(() => runtime.particleRef(element)); }} class="flies" aria-hidden="true"></canvas>
        <div {@attach (element) => { untrack(() => runtime.floatRef(element)); }} class="music-float" aria-hidden="true"></div>
        <div class="grain" aria-hidden="true"></div>

        <div id="dcCurRing" class="dc-cursor" {@attach (element) => { untrack(() => runtime.curRingRef(element)); }}></div>
        <div id="dcCurDot" class="dc-cursor" {@attach (element) => { untrack(() => runtime.curDotRef(element)); }}></div>

        <header class="hero" id="top">
          <nav class="hero-nav" aria-label="Main navigation">
            <a class="site-mark" href="#top" aria-label="ZhugeZ home">z<span class="wob" aria-hidden="true">✦</span></a>
            <div class="nav-links"><a href="#sec-works">Artworks</a><a href="#sec-about">About</a><a href="#sec-music">Music</a></div>
            <a class="nav-contact" href="mailto:dezzhuge@gmail.com">Say hello <span aria-hidden="true">↗</span></a>
          </nav>
          <div class="hero-main">
          <div class="hero-copy">
          <h1 class={'hero-word' + (v.boot === 0 ? ' intro' : '') + (v.boot < 2 ? ' greet' : '')}>Zhuge<span class="word-z">Z</span></h1>
          <p class="hero-role">Designer, developer<br /><em>&amp; music lover.</em></p>
          <p class="hero-note">Turning ideas into things<br />you can see, hear and use.</p>
          <div class="hero-actions"><a class="hero-primary" href="#sec-about">Meet the maker <span aria-hidden="true">↓</span></a><a class="hero-secondary" href="#sec-music">Explore the studio <span aria-hidden="true">↓</span></a></div>
          <div class="hero-id">
            <div class="hero-who">
                  <div style="position:relative;flex:none;">
                    <div style={style(v.ringStyle)}>
                      <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;background:var(--card);border:3px solid var(--card);animation:pf-spinr 7s linear infinite;">
                        <img src="media/avatar.webp" alt="avatar" style="width:100%;height:100%;object-fit:cover;display:block;" />
                      </div>
                    </div>
                    <span style="position:absolute;right:3px;bottom:3px;width:16px;height:16px;border-radius:50%;background:#43d17a;border:3px solid var(--card);animation:pf-pip 2.4s infinite;z-index:2;"></span>
                  </div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style={style(v.nameStyle)}>{v.artistName}</span>
                  <span style="font-size:0.8125rem;color:var(--accent);display:inline-block;animation:pf-twinkle 2.6s ease-in-out infinite;">✦</span>
                  </div>
                <button type="button" style="display:block;padding:0;border:0;background:none;font-family:'JetBrains Mono',monospace;font-size:0.8125rem;color:var(--t2);margin-top:6px;cursor:pointer;" onclick={runtime.onCopy} title="Copy handle">{v.handle} · <span style="color:var(--t4);">#0001</span></button>
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
                  <span style="font-size:0.75rem;color:var(--t2);">{v.statusText}</span>
                  <span style={style(v.cursorStyle)}></span>
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
              {#each v.works as w, i}<button type="button" class="work-cell" onclick={w.open} onpointerenter={runtime.onWorkPointer} onpointermove={runtime.onWorkPointer} onpointerleave={runtime.onWorkLeave} onpointercancel={runtime.onWorkLeave} aria-label={'Enlarge artwork ' + w.n}>
                  <img class="work-base" src={w.src} alt="" />
                  <img class="work-color" src={w.src} alt="" aria-hidden="true" />
                  <span class="work-idx" aria-hidden="true">{w.n}</span>
                </button>{/each}
            </div>

          </section>
          </div>

          <button type="button" class={'mascot' + (v.boot === 0 ? ' intro' : '') + (v.boot < 2 ? ' greet' : '') + (v.live ? ' dance' : '')} onclick={runtime.onMascot}>
            <span class="mascot-bob">
              <span class={'mascot-pop' + (v.poke ? (v.poke % 2 ? ' pa' : ' pb') : '')}><span class="mascot-3d" {@attach (element) => { untrack(() => runtime.mascotRef(element)); }}></span><img src="media/mascot-3d.webp" alt="mascot" /></span>
              <span class="say">{v.say}</span>
            </span>
          </button>
        </header>

        <main {@attach (element) => { untrack(() => runtime.rootRef(element)); }} class="wrap">

          <section class="intro-block">
            <Rise as="h2" chars class="display" text="Design, code & sound." />
            <Rise class="lede" text="I work across interfaces and software, and I’m curious about the details that make them feel right: a transition, a sound, or a tool that gets out of the way." />
          </section>

          <section id="sec-music" class="make" aria-labelledby="make-title">
            <Rise as="h2" id="make-title" tabindex={-1} chars class="display" text="Inside the studio." />
            <div class="make-grid">
            <div class="room" {@attach (element) => { untrack(() => runtime.roomRef(element)); }} role="img" aria-label="Isometric studio with a two-tier producer desk, MIDI controller, record player and server rack"></div>
            <ol class="make-list">
              {#each MAKE as m, i}<li class={state.zone === i ? 'on' : ''} onpointerenter={() => runtime.setState({ zone: i })} onpointerleave={() => runtime.setState({ zone: -1 })}>
                  <span class="make-n">{'0' + (i + 1)}</span>
                  <Rise as="h3" chars class="make-t" text={m[0]} />
                  <Rise class="make-d" text={m[1]} />
                  <span class="make-tags">{m[2]}</span>
                </li>{/each}
            </ol>
            </div>
          </section>

          <section class="process">
            <Rise as="h2" chars class="display" text="Slow ears, fast hands." />
            <div class="steps">
              {#each STEPS as st, i}<div class="step">
                  <span class="step-n">{st[0]}</span>
                  <Rise as="h3" chars class="step-t" text={st[1]} />
                  <Rise class="step-d" text={st[2]} />
                </div>{/each}
            </div>
          </section>

          <div class="grid profile-index">

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
              <p style="margin:0;font-size:0.875rem;line-height:1.7;color:var(--t2);">{v.aboutText}</p>
              <p style="margin:10px 0 0;font-size:0.875rem;line-height:1.7;color:var(--t2);">dm me if you want to talk about <span style="color:var(--accent);font-weight:600;">design, music, code or AI</span> :)</p>
            </div>

            <div id="sec-tech" class="index-section s12">
              <h2>Elsewhere on the web</h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:10px;">
                <a class="soc" href="https://sec.lyngocvu.tech" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" data-style-hover="border-color:#ff5555;transform:translateY(-3px);box-shadow:0 0 20px rgba(255,85,85,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(255,85,85,.14);display:flex;align-items:center;justify-content:center;color:#ff8585;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></span>
                  <div style="min-width:0;">
                    <div style="font-size:0.875rem;color:var(--t1);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Security & VR</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);">sec.lyngocvu.tech</div>
                  </div>
                </a>
                <a class="soc" href="https://dev.lyngocvu.tech" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" data-style-hover="border-color:#5ee0ff;transform:translateY(-3px);box-shadow:0 0 20px rgba(94,224,255,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(94,224,255,.14);display:flex;align-items:center;justify-content:center;color:#9fe9ff;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg></span>
                  <div style="min-width:0;">
                    <div style="font-size:0.875rem;color:var(--t1);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Software & Dev</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);">dev.lyngocvu.tech</div>
                  </div>
                </a>
                <a class="soc" href="https://editor.lyngocvu.tech" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" data-style-hover="border-color:#ffd166;transform:translateY(-3px);box-shadow:0 0 20px rgba(255,209,102,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(255,209,102,.14);display:flex;align-items:center;justify-content:center;color:#ffe08a;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg></span>
                  <div style="min-width:0;">
                    <div style="font-size:0.875rem;color:var(--t1);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Video Editor & Designer</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);">editor.lyngocvu.tech</div>
                  </div>
                </a>
                <a class="soc" href="https://research.lyngocvu.tech" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" data-style-hover="border-color:var(--accent);transform:translateY(-3px);box-shadow:0 0 20px rgba(201,182,255,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(201,182,255,.14);display:flex;align-items:center;justify-content:center;color:#d8c9ff;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></span>
                  <div style="min-width:0;">
                    <div style="font-size:0.875rem;color:var(--t1);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Research & Lab</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);">research.lyngocvu.tech</div>
                  </div>
                </a>
              </div>
            </div>

            <div id="sec-socials" class="index-section s5">
              <h2>Socials</h2>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <a class="soc" href="https://discord.com/app" data-discord="zhugez" title="Discord: zhugez" aria-label="Discord: add zhugez on Discord" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" data-style-hover="border-color:#7c9bff;transform:translateY(-3px);box-shadow:0 0 20px rgba(124,155,255,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(124,155,255,.14);display:flex;align-items:center;justify-content:center;color:#aab8f5;"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.369A19.79 19.79 0 0 0 15.432 3c-.21.375-.45.88-.617 1.28a18.27 18.27 0 0 0-5.63 0A12.6 12.6 0 0 0 8.56 3 19.74 19.74 0 0 0 3.677 4.37C.533 9.046-.32 13.58.1 18.057a19.9 19.9 0 0 0 6.073 3.058c.49-.668.927-1.377 1.304-2.122a12.9 12.9 0 0 1-2.05-.978c.172-.126.34-.258.502-.392a14.2 14.2 0 0 0 12.142 0c.164.139.332.27.502.392-.654.388-1.34.716-2.05.978.377.745.814 1.454 1.304 2.122a19.86 19.86 0 0 0 6.073-3.058c.5-5.177-.838-9.674-3.56-13.688zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.955 2.419-2.157 2.419zm7.96 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419z"></path></svg></span>
                  <div style="min-width:0;">
                    <div style="font-size:0.875rem;color:var(--t1);font-weight:500;">Discord</div>
                    <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t3);">zhugez</div>
                  </div>
                </a>
                <a class="soc" href="https://twitter.com/dezzhu1" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" data-style-hover="border-color:#5ee0ff;transform:translateY(-3px);box-shadow:0 0 20px rgba(94,224,255,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(94,224,255,.14);display:flex;align-items:center;justify-content:center;color:#9fe9ff;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">Twitter</span>
                </a>
                <a class="soc" href="https://github.com/zhugez" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" data-style-hover="border-color:var(--t2);transform:translateY(-3px);box-shadow:0 0 20px rgba(174,182,210,.4);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(200,210,235,.12);display:flex;align-items:center;justify-content:center;color:var(--t2);"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">GitHub</span>
                </a>
                <a class="soc" href="https://shadowforge.vercel.app" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" data-style-hover="border-color:var(--accent);transform:translateY(-3px);box-shadow:0 0 20px var(--accent);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:color-mix(in srgb,var(--accent) 14%,transparent);display:flex;align-items:center;justify-content:center;color:var(--accent);"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">Portfolio</span>
                </a>
                <a class="soc" href="mailto:dezzhuge@gmail.com" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:11px 13px;transition:.18s;" data-style-hover="border-color:#43d17a;transform:translateY(-3px);box-shadow:0 0 20px rgba(67,209,122,.5);">
                  <span class="soc-ic" style="flex:none;width:32px;height:32px;border-radius:8px;background:rgba(67,209,122,.14);display:flex;align-items:center;justify-content:center;color:#9ff0d0;"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg></span>
                  <span style="font-size:0.875rem;color:var(--t1);font-weight:500;">Email</span>
                </a>
              </div>
            </div>

            <div id="sec-links" class="index-section s4">
              <h2>Links & setup</h2>
              <div style="display:flex;flex-direction:column;gap:10px;">
                <a href="mailto:dezzhuge@gmail.com?subject=Resume%20request" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:12px 14px;transition:.18s;" data-style-hover="border-color:var(--accent);transform:translateX(3px);">
                  <span style="width:8px;height:8px;border-radius:50%;background:var(--accent);"></span>
                  <span style="flex:1;font-size:0.875rem;color:var(--t1);font-weight:500;">📄 Resume / CV</span>
                  <span style="color:var(--t4);">↗</span>
                </a>
                <a href="#sec-links" onclick={runtime.openGear} style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:12px 14px;transition:.18s;cursor:pointer;" data-style-hover="border-color:var(--accent2);transform:translateX(3px);">
                  <span style="width:8px;height:8px;border-radius:50%;background:var(--accent2);"></span>
                  <span style="flex:1;font-size:0.875rem;color:var(--t1);font-weight:500;">🛠️ Tech Stack & Setup</span>
                  <span style="color:var(--t4);">↗</span>
                </a>
                <a href="https://github.com/zhugez?tab=repositories" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;text-decoration:none;background:var(--panel);border:1px solid var(--bd);border-radius:12px;padding:12px 14px;transition:.18s;" data-style-hover="border-color:var(--accent);transform:translateX(3px);">
                  <span style="width:8px;height:8px;border-radius:50%;background:var(--accent);"></span>
                  <span style="flex:1;font-size:0.875rem;color:var(--t1);font-weight:500;">⭐ GitHub Repos</span>
                  <span style="color:var(--t4);">↗</span>
                </a>
              </div>
            </div>

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

        <button type="button" class="mag" onclick={runtime.openPalette} aria-label="Open command palette" style="position:fixed;left:18px;bottom:18px;z-index:55;display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;border:1px solid var(--bd);border-radius:99px;background:var(--card);color:var(--t2);cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.4);font-family:'JetBrains Mono',monospace;font-size:0.75rem;transition:transform .15s,border-color .15s,color .15s;" data-style-hover="transform:translateY(-2px);border-color:var(--accent);color:var(--t1);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          <span style="display:flex;align-items:center;gap:3px;"><kbd style="font-family:inherit;background:var(--panel);border:1px solid var(--bd2);border-radius:5px;padding:1px 5px;font-size:0.6875rem;color:var(--t3);">⌘</kbd><kbd style="font-family:inherit;background:var(--panel);border:1px solid var(--bd2);border-radius:5px;padding:1px 5px;font-size:0.6875rem;color:var(--t3);">K</kbd></span>
        </button>

        <aside class={'music-badge' + (v.live ? ' is-playing' : '')} style={style('--track-progress:' + v.frac * 100 + '%')} aria-label="Music controls" hidden={!v.vinyl || v.boot < 2 || !!v.modalSrc || v.gearOpen || v.paletteOpen}>
          <button type="button" class="music-record" onclick={runtime.toggleMusicBadge} aria-expanded={v.musicOpen} aria-controls="music-options" aria-label="Vinyl player" title={v.musicOpen ? 'Hide player' : 'Show player'}>
            <span class="music-disc" aria-hidden="true"></span>
          </button>
          <div class="music-options" id="music-options" hidden={!v.musicOpen}>
            <div class="music-track">
              <div><small>{(v.live ? 'Now playing' : 'Paused') + ' · Adele · 30 · vinyl'}</small><strong>{v.title}</strong></div>
              <span class="music-note">{v.vinyl?.track}</span>
            </div>
            <div class="music-transport">
              <button type="button" class="music-play" onclick={runtime.onPlayer} aria-label={v.playerAction}><PlaybackIcon playing={v.live} /></button>
              <div class="music-scrub">
                <input type="range" class="music-seek" aria-label={'Seek ' + v.title} aria-valuetext={v.curLabel + ' of ' + v.durLabel} min={0} max={v.dur || 1} step="0.1" value={v.cur} disabled={!v.dur} oninput={runtime.onSeek} />
                <div class="music-time"><span>{v.curLabel}</span><span>{v.durLabel}</span></div>
              </div>
            </div>
            <div class="music-actions">
              <button type="button" onclick={runtime.onRestart}>Restart</button>
              <button type="button" onclick={runtime.onMute}>{v.vinyl?.muted ? 'Unmute' : 'Mute'}</button>
              <button type="button" onclick={runtime.goToTurntable}>Studio ↗</button>
            </div>
          </div>
        </aside>

        <div class="theme-dock" style="position:fixed;right:18px;bottom:18px;z-index:55;display:flex;flex-direction:column;align-items:flex-end;gap:10px;">
          {#if v.panelOpen}<div style="background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:14px;box-shadow:0 16px 40px rgba(0,0,0,.4);width:206px;">
              <div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.12em;color:var(--t3);text-transform:uppercase;margin-bottom:9px;">theme</div>
              <div style="display:flex;gap:8px;margin-bottom:15px;">
                <button type="button" onclick={runtime.setDark} style={style(v.darkBtnStyle)}>☾ Dark</button>
                <button type="button" onclick={runtime.setLight} style={style(v.lightBtnStyle)}>☀ Light</button>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;letter-spacing:.12em;color:var(--t3);text-transform:uppercase;">accent</span><span style="display:flex;align-items:center;gap:6px;"><span style="width:15px;height:15px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px var(--accent);"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t2);">{v.hueLabel}</span></span></div>
              <input type="range" min="0" max="360" value={v.hue} oninput={runtime.onHue} aria-label="Accent hue" style="width:100%;height:12px;border-radius:99px;cursor:pointer;outline:none;background:linear-gradient(90deg,hsl(0 80% 65%),hsl(60 80% 65%),hsl(120 80% 65%),hsl(180 80% 65%),hsl(240 80% 65%),hsl(300 80% 65%),hsl(360 80% 65%));" />
            </div>{/if}
          <button type="button" class="mag" onclick={runtime.togglePanel} aria-label="Theme settings" style="width:50px;height:50px;border-radius:50%;border:1px solid var(--bd);cursor:pointer;background:var(--card);color:var(--accent);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.4);transition:transform .15s;" data-style-hover="transform:scale(1.08) rotate(8deg);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg></button>
        </div>

        {#if v.modalSrc}<Modal close={() => runtime.closeModal()} label="Work detail" style="position:fixed;inset:0;z-index:60;background:rgba(5,9,8,.86);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:28px;cursor:zoom-out;">
            <img src={v.modalSrc} alt="artwork" style="max-width:90vw;max-height:86vh;border-radius:16px;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 60px color-mix(in srgb,var(--accent) 30%,transparent);" />
          </Modal>{/if}

        {#if v.gearOpen}<Modal close={() => runtime.closeGear()} label="Gear and setup" style="position:fixed;inset:0;z-index:62;background:rgba(5,9,8,.86);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:24px;">
            <div style="width:100%;max-width:min(94vw,920px);max-height:90vh;background:var(--card);border:1px solid var(--bd);border-radius:16px;box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 60px var(--accent-soft,color-mix(in srgb,var(--accent) 30%,transparent));">
              <div style="position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;padding:15px 18px;background:var(--card);border-bottom:1px solid var(--bd);z-index:1;">
                <div style="display:flex;align-items:center;gap:8px;"><span style="width:4px;height:14px;border-radius:2px;background:linear-gradient(var(--accent),var(--accent2));"></span><span style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;letter-spacing:.14em;color:var(--t2);text-transform:uppercase;">gear & setup</span></div>
                <button type="button" {@attach (element) => { untrack(() => runtime.gearCloseRef(element)); }} onclick={runtime.closeGear} aria-label="Close" style="width:44px;height:44px;border-radius:10px;border:1px solid var(--bd);background:var(--panel);color:var(--t2);cursor:pointer;font-size:0.9375rem;line-height:1;display:flex;align-items:center;justify-content:center;">✕</button>
              </div>
              <div class="gear-grid" style="display:grid;grid-auto-flow:column;grid-template-rows:repeat(3,1fr);grid-auto-columns:192px;gap:12px;overflow-x:auto;overflow-y:hidden;padding:16px 18px 20px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;">
                {#each v.gear as g, i}<div style="scroll-snap-align:start;display:flex;flex-direction:column;gap:8px;background:var(--panel);border:1px solid var(--bd2);border-radius:12px;padding:13px 14px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <div style="flex:none;width:40px;height:40px;border-radius:10px;background:color-mix(in srgb,var(--accent) 12%,transparent);display:flex;align-items:center;justify-content:center;font-size:1.25rem;">{g.ic}</div>
                      {#if g.url}<a href={g.url} target="_blank" rel="noopener" onclick={runtime.stop} style="color:var(--accent2);text-decoration:none;font-size:0.8125rem;">↗</a>{/if}
                    </div>
                    <div style="min-width:0;">
                      <div style="font-size:0.8125rem;color:var(--t1);font-weight:600;line-height:1.3;">{g.name}</div>
                      <div style="font-size:0.6875rem;color:var(--t3);margin-top:3px;line-height:1.4;">{g.desc}</div>
                      {#if g.variation}<div style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);margin-top:5px;">{g.variation}</div>{/if}
                    </div>
                  </div>{/each}
              </div>
            </div>
          </Modal>{/if}

        {#if v.paletteOpen}<Modal close={() => runtime.closePalette()} label="Command palette" style="position:fixed;inset:0;z-index:80;background:rgba(5,9,8,.7);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:flex-start;justify-content:center;padding:14vh 20px 20px;">
            <div style="width:100%;max-width:560px;background:var(--card);border:1px solid var(--bd);border-radius:16px;box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 60px var(--accent-soft,color-mix(in srgb,var(--accent) 30%,transparent));overflow:hidden;">
              <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--bd);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                <input {@attach (element) => { untrack(() => runtime.paletteInputRef(element)); }} oninput={runtime.onPaletteInput} type="text" placeholder="Type a command or jump to…" aria-label="Command palette search" autocomplete="off" spellcheck={false} style="flex:1;background:none;border:none;outline:none;color:var(--t1);font-family:'Hanken Grotesk',sans-serif;font-size:1rem;min-width:0;" />
                <span style="font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);border:1px solid var(--bd);border-radius:6px;padding:2px 6px;">esc</span>
              </div>
              <div style="max-height:46vh;overflow:auto;padding:8px;">
                {#each v.paletteList as cmd, i}<button type="button" class="cmd-row" onclick={cmd.run} style={style(cmd.rowStyle) + ";width:100%;background:transparent;text-align:left;font:inherit;"}>
                    <span style="flex:none;width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:0.875rem;background:var(--accent-soft,color-mix(in srgb,var(--accent) 16%,transparent));color:var(--accent2);">{cmd.icon}</span>
                    <span style="flex:1;min-width:0;font-size:0.875rem;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{cmd.label}</span>
                    <span style="flex:none;font-family:'JetBrains Mono',monospace;font-size:0.6875rem;color:var(--t4);">{cmd.hint}</span>
                  </button>{/each}
                {#if v.paletteEmpty}<div style="padding:18px 12px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:var(--t4);">no matches</div>{/if}
              </div>
              <div style="display:flex;align-items:center;gap:14px;padding:9px 14px;border-top:1px solid var(--bd);font-family:'JetBrains Mono',monospace;font-size:0.625rem;color:var(--t4);">
                <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
              </div>
            </div>
          </Modal>{/if}
      </div>
