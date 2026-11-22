import * as THREE from 'three';
import type { FeatureFactory } from './room-feature';
import { createSpeakers } from './room-speakers';
import { lineAtTime, parseLrc, wordsSung, type Line, type Lyrics } from './vinyl-lyrics';

const DECK = 'Audio-Technica AT-LPA2';
const LEAD = 2.5, RUNOUT = 4;
const R_EDGE = 0.15, R_LEAD = 0.146, R_LOCK = 0.056;
const CARRY = new THREE.Vector3(0, 0.24, 0.3);
const HOVER = new THREE.Vector3(0, 0.06, 0);
const ZERO = new THREE.Vector3();
const IDENTITY = new THREE.Quaternion();

type Side = 'A' | 'B' | 'C' | 'D';
type Disc = { node: THREE.Object3D; n: 1 | 2; sides: [Side, Side]; pos: THREE.Vector3; quat: THREE.Quaternion; parent: THREE.Object3D };
type Flight = { disc: Disc; parent: THREE.Object3D; pos: THREE.Vector3; quat: THREE.Quaternion; from: THREE.Vector3; fromQ: THREE.Quaternion; t: number; dur: number; arc: number; done?: () => void };

// Adele · 30, Columbia 2LP 19439937971 side split (Discogs). Seconds match the encoded side files.
const SIDES: Record<Side, [string, number][]> = {
  A: [['Strangers By Nature', 182.16], ['Easy On Me', 224.69], ['My Little Love', 389.11]],
  B: [['Cry Your Heart Out', 255.28], ['Oh My God', 225.15], ['Can I Get It', 210.38]],
  C: [['I Drink Wine', 376.17], ['All Night Parking (with Erroll Garner) Interlude', 161.83], ['Woman Like Me', 300.25]],
  D: [['Hold On', 366], ['To Be Loved', 403.96], ['Love Is A Game', 403.04]],
};
// Track start offsets measured with ffmpeg silencedetect on the encoded side files, not derived from LEAD + GAP.
const STARTS: Record<Side, number[]> = { A: [2.726, 186.936, 413.587], B: [2.733, 259.995, 487.158], C: [2.719, 380.909, 544.726], D: [2.721, 370.720, 776.739] };
const starts = (side: Side) => STARTS[side];
const length = (side: Side) => { const s = starts(side), t = SIDES[side]; return s[s.length - 1] + t[t.length - 1][1]; };
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const upFor = (side: Side) => new THREE.Quaternion().setFromEuler(new THREE.Euler(side === 'A' || side === 'C' ? -Math.PI / 2 : Math.PI / 2, 0, 0));
const smooth = (x: number) => x * x * (3 - 2 * x);
const toward = (value: number, goal: number, step: number) => value + THREE.MathUtils.clamp(goal - value, -step, step);

export const turntableFeature: FeatureFactory = (ctx) => {
  const node = (name: string) => ctx.model.getObjectByName(name);
  const deck = node('turntable');
  const record = node('vinyl_record');
  const platter = node('platter');
  const arm = node('tonearm');
  const armLift = node('tonearm_lift');
  const stylus = node('lpa2_stylus');
  const armRest = arm?.rotation.y ?? 0;
  const caps = { power: node('power_button_physical_cap'), start: node('start_button_physical_cap'), 33: node('lpa2_speed_33_physical_cap'), 45: node('lpa2_speed_45_physical_cap') };
  const ledNames = { power: 'power_led', 33: 'lpa2_speed_33_led', 45: 'lpa2_speed_45_led' } as const;
  [...Object.values(caps), ...Object.values(ledNames).map(node), armLift].forEach((part) => part && ctx.keep(part));

  ctx.model.updateMatrixWorld(true);
  const pivot = arm?.position ?? ZERO, spindle = record?.position ?? ZERO;
  const tip = stylus && arm ? arm.worldToLocal(stylus.getWorldPosition(new THREE.Vector3())) : new THREE.Vector3(0, 0, 0.2);
  const radiusAt = (angle: number) => {
    const a = armRest + angle, c = Math.cos(a), s = Math.sin(a);
    return Math.hypot(pivot.x + tip.x * c + tip.z * s - spindle.x, pivot.z - tip.x * s + tip.z * c - spindle.z);
  };
  const angleFor = (radius: number) => {
    let lo = -0.8, hi = 0;
    if (radius >= radiusAt(hi)) return hi;
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (radiusAt(mid) > radius) hi = mid; else lo = mid; }
    return (lo + hi) / 2;
  };

  const holder = new THREE.Group();
  holder.position.copy(spindle).y += 0.0009;
  deck?.add(holder);

  const set = node('vinyl_set');
  const discs: Disc[] = [];
  if (set) {
    set.removeFromParent();
    const room = new THREE.Box3().setFromObject(ctx.model).getCenter(new THREE.Vector3());
    ctx.model.add(set);
    const frames = ['Cube031', 'Cube032', 'Cube035'].map(node).filter((frame): frame is THREE.Object3D => !!frame).map((frame) => new THREE.Box3().setFromObject(frame));
    if (frames.length) {
      frames.sort((a, b) => a.getCenter(new THREE.Vector3()).x - b.getCenter(new THREE.Vector3()).x);
      const all = frames.reduce((box, frame) => box.union(frame), new THREE.Box3());
      const size = all.getSize(new THREE.Vector3()), middle = frames[Math.floor(frames.length / 2)].getCenter(new THREE.Vector3());
      const thinX = size.x < size.z, sign = Math.sign(thinX ? room.x - middle.x : room.z - middle.z) || 1;
      const wall = thinX ? (sign > 0 ? all.min.x : all.max.x) : (sign > 0 ? all.min.z : all.max.z);
      const y = all.min.y - 0.07 - 0.33;
      if (thinX) { set.position.set(wall, y, middle.z); set.rotation.y = sign * Math.PI / 2; } else { set.position.set(middle.x, y, wall); set.rotation.y = sign > 0 ? 0 : Math.PI; }
    }
    set.traverse((part) => {
      if (!(part instanceof THREE.Mesh) || !(part.material instanceof THREE.MeshStandardMaterial) || !part.material.map) return;
      part.material.emissive.set(0xffffff);
      part.material.emissiveMap = part.material.map;
      part.material.emissiveIntensity = 0.12;
    });
    ([[1, ['A', 'B']], [2, ['C', 'D']]] as const).forEach(([n, sides]) => {
      const lp = node(`LP${n}`);
      if (!lp) return;
      ctx.keep(lp);
      discs.push({ node: lp, n, sides: [...sides], pos: lp.position.clone(), quat: lp.quaternion.clone(), parent: set });
    });
  }

  let onDeck: Disc | null = null, held: Disc | null = null, side: Side = 'A';
  let power = false, rpm: 33 | 45 = 33, motor = false, spin = 0, lift = 0, liftGoal = 0, armAngle = 0, armGoal = 0, grooved = false, pos = 0, intent = false;
  let panelSoon = false, exploring = false, failed = false, steps: [number, () => void][] = [], wait = 0;
  const flights = new Map<Disc, Flight>();
  const pressed = new Map<THREE.Object3D, number>();

  const audio = new Audio();
  audio.preload = 'none';
  audio.preservesPitch = false;
  (audio as HTMLAudioElement & { webkitPreservesPitch?: boolean }).webkitPreservesPitch = false;
  audio.addEventListener('error', () => { if (audio.getAttribute('src')) { failed = true; ctx.start(); } });
  const speakers = createSpeakers(ctx, audio);
  const ear = new THREE.Vector3();
  const load = (next: Side) => {
    side = next;
    failed = false;
    pos = 0;
    audio.src = new URL(`media/vinyl/adele-30-${next.toLowerCase()}.m4a`, ctx.base).href;
    audio.preload = 'auto';
  };

  const press = (cap: THREE.Object3D | undefined) => {
    if (!cap) return;
    if (!pressed.has(cap)) cap.position.z -= 0.0012;
    pressed.set(cap, 0.16);
  };
  const run = (...list: [number, () => void][]) => { steps = list; wait = list[0]?.[0] ?? 0; ctx.start(); };
  const hand = () => ctx.gesture('press');
  const lowerAt = (at: number): [number, () => void][] => {
    const pace = exploring ? 1.8 : 1;
    return [
      [0.15 * pace, () => { if (!power) { hand(); press(caps.power); power = true; } }],
      [0.25 * pace, () => { if (rpm !== 33) { hand(); press(caps[33]); rpm = 33; } }],
      [0.3 * pace, () => { if (!motor) { hand(); press(caps.start); motor = true; } }],
      [(grooved ? 0.1 : 0.4) * pace, () => { if (!grooved) hand(); liftGoal = 1; grooved = false; if (!audio.paused) audio.pause(); }],
      [0.35 * pace, () => { armGoal = angleFor(groove(at)); }],
      [0.9 * pace, () => { liftGoal = 0; }],
    ];
  };
  const play = (at: number) => { intent = true; run(...lowerAt(at)); };
  const parking: [number, () => void][] = [
    [0, () => { liftGoal = 1; }],
    [0.35, () => { armGoal = 0; }],
    [0.9, () => { liftGoal = 0; }],
    [0.3, () => { if (motor) { press(caps.start); motor = false; } }],
  ];
  const stop = (...then: [number, () => void][]) => { intent = false; run(...parking, ...then); };

  const end = () => length(side);
  const endRadius = () => R_LEAD - 0.088 * Math.min(1, end() / 1200);
  function groove(at: number) {
    const total = end(), last = endRadius();
    return at <= total ? R_LEAD - (R_LEAD - last) * at / total : last - (last - R_LOCK) * Math.min(1, (at - total) / RUNOUT);
  }
  const timeAt = (radius: number) => radius >= endRadius() ? THREE.MathUtils.clamp((R_LEAD - radius) / (R_LEAD - endRadius()) * end(), 0, end()) : end() + RUNOUT;
  const busyDeck = () => intent || (grooved && motor);
  const track = () => trackAt(pos);

  function fly(disc: Disc, parent: THREE.Object3D, at: THREE.Vector3, quat: THREE.Quaternion, dur: number, done?: () => void, arc = 0.08) {
    const from = disc.node.getWorldPosition(new THREE.Vector3()), fromQ = disc.node.getWorldQuaternion(new THREE.Quaternion());
    ctx.model.attach(disc.node);
    flights.set(disc, { disc, parent, pos: at.clone(), quat: quat.clone(), from, fromQ, t: 0, dur, arc, done });
    ctx.start();
  }
  const setWorld = (object: THREE.Object3D, at: THREE.Vector3, quat: THREE.Quaternion) => {
    object.parent!.updateWorldMatrix(true, false);
    new THREE.Matrix4().compose(at, quat, new THREE.Vector3(1, 1, 1)).premultiply(object.parent!.matrixWorld.clone().invert()).decompose(object.position, object.quaternion, object.scale);
  };
  const shelve = (disc: Disc, instant = false) => {
    if (onDeck === disc) { onDeck = null; intent = false; steps = []; liftGoal = 0; armGoal = 0; audio.pause(); report(); }
    if (held === disc) { held = null; ctx.carry(false); }
    fly(disc, disc.parent, disc.pos, disc.quat, instant ? 0 : 0.7, () => { if (!onDeck && record) record.visible = true; });
  };
  function place(disc: Disc, fromHands = exploring) {
    if (held === disc) { held = null; ctx.carry(false); }
    if (onDeck && onDeck !== disc) shelve(onDeck);
    onDeck = disc;
    speakers.connect();
    if (record) record.visible = false;
    load(disc.sides[0]);
    if (fromHands) ctx.gesture('place');
    fly(disc, holder, HOVER, upFor(side), fromHands ? 0.55 : 0.35, () => {
      fly(disc, holder, ZERO, upFor(side), fromHands ? 0.4 : 0.2, () => play(0), 0);
    }, fromHands ? 0.02 : 0.06);
  }
  function pick(disc: Disc) {
    if (disc === onDeck) return `LP ${disc.n} is on the turntable`;
    if (disc === held) { shelve(disc); return `LP ${disc.n} · back on the ledge`; }
    if (!exploring) { place(disc); return `LP ${disc.n} · side ${disc.sides[0]} on the platter`; }
    if (held) shelve(held);
    const body = ctx.carry(true);
    if (!body) { place(disc); return `LP ${disc.n} · side ${disc.sides[0]} on the platter`; }
    held = disc;
    fly(disc, body, CARRY, IDENTITY, 0.45, () => { if (held === disc && deck) ctx.walkTo(deck); });
    return `LP ${disc.n} · taking it to the turntable`;
  }
  function flip() {
    const disc = onDeck;
    if (!disc) return;
    const next = disc.sides[disc.sides[0] === side ? 1 : 0];
    stop([1.3, () => {
      load(next);
      ctx.gesture('place');
      fly(disc, holder, HOVER.clone().setY(0.1), disc.node.quaternion, 0.35, () => fly(disc, holder, HOVER, upFor(next), 0.45, () => fly(disc, holder, ZERO, upFor(next), 0.35, () => play(0), 0), 0), 0);
    }]);
  }

  const trackAt = (at: number) => { const s = starts(side); let i = 0; while (i + 1 < s.length && at >= s[i + 1] - 0.5) i++; return i; };
  const lyrics = new Map<string, Lyrics | null>();
  const silent = { line: null as Line | null, sung: 0, key: '', at: 0, lineEnd: 0 };
  function lyricLine() {
    if (!onDeck || audio.paused || failed) return silent;
    const at = audio.currentTime, i = trackAt(at), t = at - starts(side)[i];
    if (t < 0 || t > SIDES[side][i][1]) return silent;
    const code = `${side}${i + 1}`;
    if (!lyrics.has(code)) {
      lyrics.set(code, null);
      fetch(new URL(`media/vinyl/lyrics/${code}.lrc`, ctx.base))
        .then((response) => response.ok ? response.text() : response.status === 404 ? '' : Promise.reject(response.status))
        .then((text) => { const lines = /^\s*</.test(text) ? [] : parseLrc(text); if (lines.length) { lyrics.set(code, lines); ctx.start(); } })
        .catch(() => setTimeout(() => lyrics.delete(code), 15000));
    }
    const lines = lyrics.get(code), line = lines ? lineAtTime(lines, t) : null;
    return line?.text ? { line, sung: wordsSung(line, t), key: `${code}:${line.t}`, at: t, lineEnd: line.end } : silent;
  }
  const lyricWords = () => { const { line, sung, key, at, lineEnd } = lyricLine(); return { line: line?.text ?? '', words: line?.words ?? [], sung, lyricKey: key, lyricAt: at, wordTimes: line?.times ?? [], lineEnd }; };
  function report() {
    if (!onDeck) { ctx.reportVinyl(null); return; }
    const at = audio.paused ? pos : audio.currentTime, i = trackAt(at), s = starts(side)[i];
    ctx.reportVinyl({ title: SIDES[side][i][0], track: `${side}${i + 1}`, cur: THREE.MathUtils.clamp(at - s, 0, SIDES[side][i][1]), dur: SIDES[side][i][1], playing: !audio.paused, muted: speakers.state.muted, ...lyricWords() });
  }
  for (const type of ['play', 'pause', 'timeupdate', 'seeked', 'emptied', 'loadstart']) audio.addEventListener(type, report);
  function drop(at: number) {
    if (!onDeck) return;
    speakers.connect();
    intent = true;
    steps = [];
    if (!power) { press(caps.power); power = true; }
    if (rpm !== 33) { press(caps[33]); rpm = 33; }
    if (!motor) { press(caps.start); motor = true; }
    spin = 1;
    pos = at;
    lift = liftGoal = 0;
    armAngle = armGoal = angleFor(groove(at));
    grooved = true;
    audio.playbackRate = 1;
    audio.currentTime = at;
    audio.play().catch(() => {});
    ctx.start();
  }
  function raise() {
    if (!onDeck) return;
    if (!audio.paused) pos = audio.currentTime;
    intent = false;
    steps = [];
    lift = liftGoal = 1;
    grooved = false;
    audio.pause();
    ctx.start();
  }
  ctx.shared.deck = {
    toggle: () => { if (!audio.paused || intent) raise(); else drop(pos > LEAD && pos < end() ? pos : 0); },
    pause: () => { if (!audio.paused || intent) raise(); },
    seek: (seconds) => {
      const at = starts(side)[trackAt(audio.paused ? pos : audio.currentTime)] + seconds;
      if (!audio.paused) drop(at);
      else { pos = at; if (!grooved) armAngle = armGoal = angleFor(groove(at)); report(); ctx.start(); }
    },
    restart: () => {
      const at = starts(side)[trackAt(audio.paused ? pos : audio.currentTime)];
      if (!audio.paused) drop(at); else { pos = at; report(); }
    },
    mute: () => { speakers.mute(); report(); },
  };

  const panel = document.createElement('div');
  panel.className = 'room-seat room-deck';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Turntable controls');
  panel.hidden = true;
  ctx.stage.append(panel);
  let panelKey = '', openNear: string | undefined, now = '';
  const status = document.createElement('p');
  status.className = 'room-deck-now';
  const openPanel = () => { openNear = ctx.host.dataset.roomNear ?? ''; panelKey = ''; };
  const closePanel = () => { openNear = undefined; panel.hidden = true; delete ctx.stage.dataset.deck; };
  function renderPanel() {
    const sp = speakers.state;
    const key = [power, rpm, motor, liftGoal, side, intent, onDeck?.n, track(), sp.volume, sp.bass, sp.treble, sp.muted].join();
    if (key === panelKey) return;
    panelKey = key;
    const focusAct = panel.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.deck : undefined;
    const button = (text: string, act: string, pressedState?: boolean, into?: HTMLElement) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.dataset.deck = act;
      element.textContent = text;
      if (pressedState !== undefined) element.setAttribute('aria-pressed', String(pressedState));
      into?.append(element);
      return element;
    };
    const head = document.createElement('header');
    const title = document.createElement('strong');
    title.textContent = 'AT-LPA2';
    const meta = document.createElement('span');
    for (const [text, on] of [[`Adele · 30 · side ${side}`, false], [rpm === 33 ? '33⅓ rpm' : '45 rpm', rpm === 45], [power ? (motor ? 'Spinning' : 'Standby') : 'Off', motor]] as const) {
      const chip = document.createElement('small');
      chip.textContent = text;
      if (on) chip.className = 'on';
      meta.append(chip);
    }
    head.append(title, meta);
    const deckRow = document.createElement('div');
    button('Power', 'power', power, deckRow);
    const speed = document.createElement('span');
    speed.className = 'room-seat-group';
    speed.setAttribute('role', 'group');
    speed.setAttribute('aria-label', 'Speed');
    button('33⅓', '33', rpm === 33, speed);
    button('45', '45', rpm === 45, speed);
    deckRow.append(speed);
    button(motor ? 'Stop' : 'Start', 'start', motor, deckRow);
    button(liftGoal > 0.5 ? 'Lower arm' : 'Lift arm', 'cue', liftGoal > 0.5, deckRow);
    const tracks = document.createElement('div');
    tracks.className = 'room-deck-tracks';
    const current = grooved && pos >= LEAD - 0.5 && pos < end() ? track() : -1;
    SIDES[side].forEach(([name], i) => button(`${side}${i + 1} · ${name}`, `track-${i}`, i === current, tracks));
    const amp = document.createElement('div');
    amp.className = 'room-deck-amp';
    const label = document.createElement('small');
    label.textContent = 'Ortizan C7';
    amp.append(label);
    for (const [name, knob] of [['Vol', 'volume'], ['Bass', 'bass'], ['Treble', 'treble']] as const) {
      const group = document.createElement('span');
      group.className = 'room-seat-group';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', `${name} ${Math.round(sp[knob] * 100)}%`);
      button('−', `${knob}-down`, undefined, group).setAttribute('aria-label', `${name} down`);
      const value = document.createElement('output');
      const db = Math.round((sp[knob] - 0.5) * 24);
      value.textContent = knob === 'volume' ? `${name} ${Math.round(sp[knob] * 100)}` : `${name} ${db > 0 ? '+' : ''}${db} dB`;
      group.append(value);
      button('+', `${knob}-up`, undefined, group).setAttribute('aria-label', `${name} up`);
      amp.append(group);
    }
    button(sp.muted ? 'Unmute' : 'Mute', 'mute', sp.muted, amp);
    const more = document.createElement('div');
    button(`Flip to side ${onDeck ? onDeck.sides[onDeck.sides[0] === side ? 1 : 0] : ''}`, 'flip', undefined, more);
    button('Back to the ledge', 'shelve', undefined, more);
    button('Done', 'done', undefined, more).className = 'room-deck-done';
    panel.replaceChildren(head, status, deckRow, tracks, amp, more);
    if (focusAct) panel.querySelector<HTMLElement>(`[data-deck="${focusAct}"]`)?.focus({ preventScroll: true });
  }
  panel.addEventListener('click', (event) => {
    const act = (event.target as Element).closest<HTMLElement>('[data-deck]')?.dataset.deck;
    if (!act || !onDeck) return;
    const knob = /^(volume|bass|treble)-(up|down)$/.exec(act);
    if (knob) speakers.nudge(knob[1] as 'volume' | 'bass' | 'treble', knob[2] === 'up' ? 0.05 : -0.05);
    else if (act === 'mute') speakers.mute();
    else if (act === 'power') { press(caps.power); power = !power; if (!power) motor = false; }
    else if ((act === '33' || act === '45') && power) { press(caps[act]); rpm = act === '33' ? 33 : 45; }
    else if (act === 'start' && power) { press(caps.start); motor = !motor; }
    else if (act === 'cue') liftGoal = liftGoal > 0.5 ? 0 : 1;
    else if (act.startsWith('track-')) play(Math.max(0, starts(side)[Number(act.slice(6))] - 1));
    else if (act === 'flip') flip();
    else if (act === 'shelve') { const disc = onDeck; stop([0.5, () => shelve(disc)]); }
    else if (act === 'done') closePanel();
    ctx.start();
    report();
  });
  const onEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || panel.hidden) return;
    event.stopImmediatePropagation();
    closePanel();
  };
  window.addEventListener('keydown', onEscape, true);

  const canvas = ctx.renderer.domElement;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0));
  let drag: { disc: Disc; id: number; x: number; y: number; moved: boolean; snap: boolean } | null = null, swallow = false;
  const aim = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    ray.setFromCamera(ndc, ctx.camera);
  };
  const onDown = (event: PointerEvent) => {
    if (!exploring || event.button !== 0 || drag || ctx.host.dataset.roomActivity) return;
    aim(event);
    const free = discs.filter((disc) => disc !== onDeck && disc !== held && !flights.has(disc));
    const hit = ray.intersectObjects(free.map((disc) => disc.node), true)[0];
    const disc = hit && free.find((entry) => { let part: THREE.Object3D | null = hit.object; while (part && part !== entry.node) part = part.parent; return !!part; });
    if (!disc) return;
    event.stopImmediatePropagation();
    try { canvas.setPointerCapture(event.pointerId); } catch {}
    drag = { disc, id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, snap: false };
  };
  const onMove = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    event.stopImmediatePropagation();
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
    if (!drag.moved) { drag.moved = true; ctx.model.attach(drag.disc.node); }
    aim(event);
    const center = holder.getWorldPosition(new THREE.Vector3());
    plane.constant = -(center.y + 0.06);
    const point = ray.ray.intersectPlane(plane, new THREE.Vector3());
    if (!point) return;
    drag.snap = Math.hypot(point.x - center.x, point.z - center.z) < 0.24;
    const quat = holder.getWorldQuaternion(new THREE.Quaternion()).multiply(upFor(drag.disc.sides[0]));
    setWorld(drag.disc.node, drag.snap ? center.setY(center.y + 0.06) : point, quat);
    ctx.host.style.cursor = 'grabbing';
    ctx.start();
  };
  const onUp = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    event.stopImmediatePropagation();
    try { canvas.releasePointerCapture(event.pointerId); } catch {}
    const { disc, moved, snap } = drag;
    drag = null;
    ctx.host.style.cursor = '';
    if (!moved) return;
    swallow = true;
    if (snap) { place(disc, false); openPanel(); } else shelve(disc);
  };
  const onClick = (event: MouseEvent) => { if (swallow) { swallow = false; event.stopImmediatePropagation(); } };
  canvas.addEventListener('pointerdown', onDown, true);
  canvas.addEventListener('pointermove', onMove, true);
  canvas.addEventListener('pointerup', onUp, true);
  canvas.addEventListener('pointercancel', onUp, true);
  canvas.addEventListener('click', onClick, true);

  const sideOf = (disc: Disc) => onDeck === disc ? side : disc.sides[0];
  if (deck) ctx.addTarget({
    object: deck,
    label: DECK,
    detail: 'Record player',
    zone: 2,
    hover: () => held ? 'Record player · put the record on' : !onDeck ? 'Record player · no record on the platter' : `Record player · Adele · 30 · side ${side}`,
    action: () => held ? 'Put the record on' : !onDeck ? 'Check the platter' : busyDeck() ? 'Lift the arm' : `Play side ${side}`,
    gesture: () => held ? null : 'press',
    use: () => {
      if (held) { const disc = held; place(disc); panelSoon = exploring; return `LP ${disc.n} · side ${disc.sides[0]} on the platter`; }
      if (!onDeck) {
        return 'No record on the platter · take an Adele · 30 LP from the ledge';
      }
      if (exploring) openPanel();
      if (busyDeck()) { stop(); return `Side ${side} · lifting the arm`; }
      play(pos > 0 && pos < end() ? pos : 0);
      return `Side ${side} · dropping the needle`;
    },
  });
  for (const disc of discs) ctx.addTarget({
    object: disc.node,
    label: `Adele · 30 · LP ${disc.n}`,
    detail: `Sides ${disc.sides.join(' / ')}`,
    hover: () => `Adele · 30 · LP ${disc.n} · ${disc === held ? 'in your hands' : `side ${sideOf(disc)} · drag it onto the turntable`}`,
    action: () => disc === held ? 'Put the record back' : `Take out LP ${disc.n}`,
    gesture: () => disc === onDeck ? null : 'press',
    use: () => pick(disc),
  });
  const jacket = node('Adele_30_Jacket');
  if (jacket) ctx.addTarget({ object: jacket, label: 'Adele · 30', detail: 'Columbia · 2021 · 2LP · 12 tracks · take out an LP to play it' });

  const canvasSprite = document.createElement('canvas');
  canvasSprite.width = 1024;
  canvasSprite.height = 160;
  const context = canvasSprite.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvasSprite);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, depthWrite: false, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 10;
  sprite.scale.set(0.96, 0.15, 1);
  sprite.visible = false;
  sprite.raycast = () => {};
  ctx.world.add(sprite);
  const origin = new THREE.Vector3();
  record?.getWorldPosition(origin);
  let lastLine: Line | null = null, lastSung = -1, since = 0, ledKey = '';
  const drawLine = (words: string[], sung: number) => {
    context.clearRect(0, 0, 1024, 160);
    const fit = (text: string[]) => { let size = 56; context.font = `600 ${size}px system-ui, sans-serif`; const wide = Math.max(...text.map((row) => context.measureText(row).width)); if (wide > 990) size = Math.floor(size * 990 / wide); context.font = `600 ${size}px system-ui, sans-serif`; return size; };
    let rows = [words];
    if (words.length > 1 && fit([words.join(' ')]) < 38) {
      const half = words.join(' ').length / 2;
      let cut = 1;
      while (cut < words.length - 1 && words.slice(0, cut + 1).join(' ').length <= half) cut++;
      rows = [words.slice(0, cut), words.slice(cut)];
    }
    const size = fit(rows.map((row) => row.join(' ')));
    const space = context.measureText(' ').width;
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.shadowColor = 'rgba(125, 151, 236, 0.95)';
    let k = 0;
    rows.forEach((row, i) => {
      let x = 512 - context.measureText(row.join(' ')).width / 2;
      const y = 80 + (i - (rows.length - 1) / 2) * size * 1.15;
      for (const word of row) {
        const on = k++ < sung;
        context.fillStyle = on ? '#ffffff' : 'rgba(226, 230, 255, 0.4)';
        context.shadowBlur = on ? 18 : 0;
        context.fillText(word, x, y);
        x += context.measureText(word).width + space;
      }
    });
    texture.needsUpdate = true;
  };
  const leds: Partial<Record<keyof typeof ledNames, THREE.MeshStandardMaterial>> = {};

  return {
    ready() {
      speakers.ready();
      for (const [key, name] of Object.entries(ledNames) as [keyof typeof ledNames, string][]) {
        const mesh = node(name);
        if (mesh instanceof THREE.Mesh && mesh.material instanceof THREE.MeshStandardMaterial) leds[key] = mesh.material = mesh.material.clone();
      }
    },
    frame({ now: time, dt, animate, exploring: inside }) {
      exploring = inside;
      let busy = false;
      if (!exploring) panelSoon = false;
      if (!exploring && held) shelve(held, true);
      if (!exploring && !panel.hidden) closePanel();

      if (steps.length) {
        busy = true;
        wait -= dt;
        while (steps.length && wait <= 0) {
          steps.shift()![1]();
          wait += steps[0]?.[0] ?? 0;
        }
      }
      for (const [cap, left] of pressed) {
        if (left - dt > 0) pressed.set(cap, left - dt);
        else { cap.position.z += 0.0012; pressed.delete(cap); }
        busy = true;
      }
      for (const flight of flights.values()) {
        flight.t = animate && flight.dur > 0 ? Math.min(1, flight.t + dt / flight.dur) : 1;
        const e = smooth(flight.t);
        flight.parent.updateWorldMatrix(true, false);
        const goal = flight.pos.clone().applyMatrix4(flight.parent.matrixWorld);
        const goalQ = flight.parent.getWorldQuaternion(new THREE.Quaternion()).multiply(flight.quat);
        setWorld(flight.disc.node, flight.from.clone().lerp(goal, e).setY(THREE.MathUtils.lerp(flight.from.y, goal.y, e) + Math.sin(Math.PI * e) * flight.arc), flight.fromQ.clone().slerp(goalQ, e));
        if (flight.t >= 1) {
          flights.delete(flight.disc);
          flight.parent.add(flight.disc.node);
          flight.disc.node.position.copy(flight.pos);
          flight.disc.node.quaternion.copy(flight.quat);
          flight.disc.node.scale.setScalar(1);
          flight.done?.();
        }
        busy = true;
      }
      if (drag) busy = true;
      if (panelSoon && !steps.length && !flights.size) { panelSoon = false; if (onDeck) openPanel(); }

      if (!onDeck) {
        armGoal = 0;
        armAngle = animate ? THREE.MathUtils.lerp(armAngle, armGoal, 1 - Math.exp(-dt * 8)) : armGoal;
        if (Math.abs(armAngle - armGoal) > 0.002) busy = true;
        if (audio.getAttribute('src') && !audio.paused) audio.pause();
      } else {
        spin = toward(spin, power && motor ? 1 : 0, spin < (power && motor ? 1 : 0) ? dt / 1.6 : dt / 1.2);
        lift = animate ? toward(lift, liftGoal, dt * 2.4) : liftGoal;
        const down = lift < 0.02 && radiusAt(armAngle) <= R_EDGE;
        if (down && !grooved) pos = timeAt(radiusAt(armAngle));
        grooved = down;
        const rate = rpm / (100 / 3);
        if (grooved) {
          const audible = spin > 0.07 && pos < end() && !failed;
          if (audible) {
            const next = Math.max(0.07, rate * spin);
            if (Math.abs(audio.playbackRate - next) > 0.005) audio.playbackRate = next;
            if (audio.paused) {
              if (Math.abs(audio.currentTime - pos) > 0.25) audio.currentTime = pos;
              audio.play().catch(() => {});
            } else pos = Math.max(pos, audio.currentTime);
          } else {
            if (!audio.paused) audio.pause();
            if (spin > 0 && (pos >= end() || failed)) pos += dt * rate * spin;
          }
          armAngle = armGoal = angleFor(groove(pos));
        } else {
          if (!audio.paused) audio.pause();
          armAngle = animate ? toward(armAngle, armGoal, dt * 0.9) : armGoal;
        }
        if (animate) {
          const turn = dt * rpm * Math.PI / 30 * spin;
          holder.rotation.y -= turn;
          if (platter) platter.rotation.y -= turn;
        }
        if (spin > 0 || lift !== liftGoal || armAngle !== armGoal || intent) busy = true;
      }
      if (arm) arm.rotation.y = armRest + armAngle;
      if (armLift) armLift.rotation.x = -0.05 * lift;
      ctx.shared.vinyl = !audio.paused;
      const nowPlaying = onDeck && !audio.paused ? `Adele · ${SIDES[side][track()][0]} · ${speakers.state.muted ? 'muted' : `volume ${Math.round(speakers.state.volume * 100)}%`}` : '';
      if (ctx.shared.nowPlaying !== nowPlaying) ctx.shared.nowPlaying = nowPlaying;
      if (speakers.frame(dt, animate, !audio.paused, exploring ? ctx.player.getWorldPosition(ear) : null)) busy = true;
      const tag = onDeck ? `${side} ${audio.paused ? 'stopped' : 'playing'}` : '';
      if (ctx.host.dataset.roomVinyl !== tag) ctx.host.dataset.roomVinyl = tag;

      const key = `${power}${rpm}`;
      if (key !== ledKey) {
        ledKey = key;
        for (const [name, led] of Object.entries(leds)) {
          const on = power && (name === 'power' || name === String(rpm));
          led.emissive.set(on ? 0xcfe6ff : 0x000000);
          led.emissiveIntensity = on ? 2.4 : 0;
        }
      }

      if (ctx.shared.vinyl) busy = true;
      const { line, sung } = lyricLine();
      const text = line?.text ?? '';
      ctx.shared.lyric = sung ? `${text}#${sung}` : text;
      if (ctx.host.dataset.roomLyric !== text) ctx.host.dataset.roomLyric = text;
      if (ctx.host.dataset.roomSung !== String(sung)) ctx.host.dataset.roomSung = String(sung);
      if (line !== lastLine || sung !== lastSung) report();
      if (line && line !== lastLine) { since = time; material.opacity = animate ? 0 : 1; }
      if (line && (line !== lastLine || sung !== lastSung)) drawLine(line.words, sung);
      lastLine = line;
      lastSung = sung;
      const fade = line ? 1 : 0;
      material.opacity = animate ? toward(material.opacity, fade, dt * 3) : fade;
      sprite.visible = material.opacity > 0.01;
      sprite.position.copy(origin);
      sprite.position.y += 0.2 + (animate ? Math.min((time - since) / 1000, 4) * 0.01 : 0);
      if (material.opacity !== fade) busy = true;

      if (openNear !== undefined && (!onDeck || ctx.host.dataset.roomNear !== openNear)) closePanel();
      if (openNear !== undefined && onDeck) {
        renderPanel();
        const s = starts(side), i = track();
        const line = failed ? `Couldn't load side ${side}`
          : !grooved ? (lift > 0.5 ? 'Arm raised' : armAngle > -0.02 ? 'Arm on its rest' : 'Arm lowering')
          : spin < 0.05 ? 'Needle down · platter stopped'
          : pos < LEAD - 0.5 ? 'Lead-in groove'
          : pos >= end() ? 'Run-out groove · lift the arm to stop'
          : `${side}${i + 1} · ${SIDES[side][i][0]} · ${clock(Math.max(0, pos - s[i]))} / ${clock(SIDES[side][i][1])}`;
        if (line !== now) status.textContent = now = line;
        if (panel.hidden) { panel.hidden = false; ctx.stage.dataset.deck = ''; }
      }
      return busy;
    },
    dispose() {
      window.removeEventListener('keydown', onEscape, true);
      canvas.removeEventListener('pointerdown', onDown, true);
      canvas.removeEventListener('pointermove', onMove, true);
      canvas.removeEventListener('pointerup', onUp, true);
      canvas.removeEventListener('pointercancel', onUp, true);
      canvas.removeEventListener('click', onClick, true);
      audio.pause();
      audio.removeAttribute('src');
      for (const type of ['play', 'pause', 'timeupdate', 'seeked', 'emptied', 'loadstart']) audio.removeEventListener(type, report);
      if (ctx.shared.deck) delete ctx.shared.deck;
      ctx.reportVinyl(null);
      ctx.shared.vinyl = false;
      ctx.shared.nowPlaying = '';
      speakers.dispose();
      closePanel();
      panel.remove();
      sprite.removeFromParent();
      texture.dispose();
      material.dispose();
      Object.values(leds).forEach((led) => led.dispose());
    },
  };
};
