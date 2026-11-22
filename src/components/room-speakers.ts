import * as THREE from 'three';
import type { RoomContext } from './room-feature';

const SWEEP = 270 * Math.PI / 180;
const EXCURSION = 0.004;
type Knob = 'volume' | 'bass' | 'treble';

export function createSpeakers(ctx: RoomContext, media: HTMLMediaElement) {
  const node = (name: string) => ctx.model.getObjectByName(name);
  const woofers = ['c7_woofer_left', 'c7_woofer_right'].map(node);
  const wooferRest = woofers.map((woofer) => woofer?.position.z ?? 0);
  const knobs = { volume: node('c7_volume_knob'), bass: node('c7_bass_knob'), treble: node('c7_treble_knob') };
  const knobRest = Object.fromEntries(Object.entries(knobs).map(([key, knob]) => [key, knob?.rotation.z ?? 0])) as Record<Knob, number>;
  const preset = Object.fromEntries(Object.entries(knobs).map(([key, knob]) => [key, Number(knob?.userData.default ?? 0.5)])) as Record<Knob, number>;
  const state = { ...preset, muted: false };
  const ledNode = node('c7_status_LED');
  [...Object.values(knobs), ledNode].forEach((part) => part && ctx.keep(part));
  let led: { material: THREE.MeshStandardMaterial; color: THREE.Color; intensity: number } | undefined;

  let audio: AudioContext | undefined, bass: BiquadFilterNode | undefined, treble: BiquadFilterNode | undefined, gain: GainNode | undefined;
  const meters: { analyser: AnalyserNode; panner: PannerNode; data: Float32Array<ArrayBuffer>; level: number }[] = [];
  const middle = new THREE.Vector3(), facing = new THREE.Vector3(), ear = new THREE.Vector3(), forward = new THREE.Vector3();

  const apply = () => {
    if (gain && audio) gain.gain.setTargetAtTime(state.muted ? 0 : state.volume * state.volume * 1.6, audio.currentTime, 0.03);
    if (bass && audio) bass.gain.setTargetAtTime((state.bass - 0.5) * 24, audio.currentTime, 0.03);
    if (treble && audio) treble.gain.setTargetAtTime((state.treble - 0.5) * 24, audio.currentTime, 0.03);
    for (const [key, knob] of Object.entries(knobs) as [Knob, THREE.Object3D | undefined][]) {
      const rear = key !== 'volume';
      if (knob) knob.rotation.z = knobRest[key] + (rear ? 1 : -1) * (state[key] - preset[key]) * SWEEP;
    }
    ctx.start();
  };

  function connect() {
    if (audio) {
      if (audio.state === 'suspended') audio.resume().catch(() => {});
      return;
    }
    if (!window.AudioContext) return;
    audio = new AudioContext();
    const source = audio.createMediaElementSource(media);
    bass = new BiquadFilterNode(audio, { type: 'lowshelf', frequency: 120 });
    treble = new BiquadFilterNode(audio, { type: 'highshelf', frequency: 6000 });
    gain = audio.createGain();
    const split = audio.createChannelSplitter(2);
    source.connect(bass).connect(treble).connect(gain).connect(split);
    ctx.model.updateMatrixWorld(true);
    middle.set(0, 0, 0);
    facing.set(0, 0, 0);
    for (const woofer of woofers) {
      if (!woofer) continue;
      middle.add(woofer.getWorldPosition(new THREE.Vector3()).multiplyScalar(1 / woofers.length));
      facing.add(new THREE.Vector3(0, 0, 1).transformDirection(woofer.matrixWorld));
    }
    facing.setY(0).normalize();
    woofers.forEach((woofer, channel) => {
      const analyser = new AnalyserNode(audio!, { fftSize: 512 });
      const at = woofer?.getWorldPosition(new THREE.Vector3()) ?? new THREE.Vector3(channel ? 1 : -1, 1, 0);
      const panner = new PannerNode(audio!, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 1, rolloffFactor: 0.6, positionX: at.x, positionY: at.y, positionZ: at.z });
      split.connect(analyser, channel);
      split.connect(panner, channel);
      panner.connect(audio!.destination);
      meters.push({ analyser, panner, data: new Float32Array(analyser.fftSize), level: 0 });
    });
    apply();
  }
  const wake = () => { if (audio?.state === 'suspended') audio.resume().catch(() => {}); };
  window.addEventListener('pointerdown', wake, true);
  window.addEventListener('keydown', wake, true);

  return {
    connect,
    get state() { return state; },
    nudge(key: Knob, delta: number) {
      state[key] = THREE.MathUtils.clamp(Math.round((state[key] + delta) * 20) / 20, 0, 1);
      if (key === 'volume') state.muted = false;
      apply();
    },
    mute() { state.muted = !state.muted; apply(); },
    ready() {
      if (ledNode instanceof THREE.Mesh && ledNode.material instanceof THREE.MeshStandardMaterial) {
        const material = ledNode.material = ledNode.material.clone();
        led = { material, color: material.emissive.clone(), intensity: material.emissiveIntensity };
      }
    },
    frame(dt: number, animate: boolean, playing: boolean, listener: THREE.Vector3 | null) {
      let busy = false;
      if (audio) {
        if (listener) ear.copy(listener).setY(listener.y + 0.6);
        else ear.copy(middle).addScaledVector(facing, 1.2);
        forward.subVectors(middle, ear).setY(0);
        if (forward.lengthSq() < 1e-4) forward.copy(facing).negate();
        forward.normalize();
        const l = audio.listener, t = audio.currentTime;
        if (l.positionX) {
          l.positionX.setTargetAtTime(ear.x, t, 0.05);
          l.positionY.setTargetAtTime(ear.y, t, 0.05);
          l.positionZ.setTargetAtTime(ear.z, t, 0.05);
          l.forwardX.setTargetAtTime(forward.x, t, 0.05);
          l.forwardY.setTargetAtTime(0, t, 0.05);
          l.forwardZ.setTargetAtTime(forward.z, t, 0.05);
          l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
        } else {
          l.setPosition(ear.x, ear.y, ear.z);
          l.setOrientation(forward.x, 0, forward.z, 0, 1, 0);
        }
      }
      meters.forEach((meter, i) => {
        let level = 0;
        if (playing && animate) {
          meter.analyser.getFloatTimeDomainData(meter.data);
          let sum = 0;
          for (const v of meter.data) sum += v * v;
          level = Math.min(1, Math.sqrt(sum / meter.data.length) * 4);
        }
        meter.level += (level - meter.level) * Math.min(1, dt * 30);
        if (meter.level < 0.002) meter.level = 0;
        const woofer = woofers[i];
        if (woofer) woofer.position.z = wooferRest[i] + meter.level * EXCURSION;
        if (meter.level > 0) busy = true;
      });
      if (led) {
        const blink = state.muted && Math.floor(performance.now() / 600) % 2 === 0;
        led.material.emissive.set(state.muted ? (blink ? 0xff2a2a : 0x000000) : led.color);
        led.material.emissiveIntensity = state.muted ? 2.4 : led.intensity;
        if (state.muted) busy = true;
      }
      return busy;
    },
    dispose() {
      window.removeEventListener('pointerdown', wake, true);
      window.removeEventListener('keydown', wake, true);
      led?.material.dispose();
      audio?.close().catch(() => {});
    },
  };
}

export type Speakers = ReturnType<typeof createSpeakers>;
