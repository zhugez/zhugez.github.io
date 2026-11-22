type Voice = { gain: GainNode; sources: AudioScheduledSourceNode[]; nodes: AudioNode[] };

const MAX_VOICES = 32;

export class PianoSynth {
  #ctx: AudioContext | null = null;
  #out: GainNode | null = null;
  #wave: PeriodicWave | null = null;
  #noise: AudioBuffer | null = null;
  #voices = new Map<number, Voice>();

  get active() {
    return this.#voices.size;
  }

  #context() {
    if (this.#ctx) return this.#ctx;
    const ctx = new AudioContext({ latencyHint: 'interactive' });
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 4;
    this.#out = ctx.createGain();
    this.#out.gain.value = 0.7;
    this.#out.connect(compressor).connect(ctx.destination);
    const harmonics = 12, real = new Float32Array(harmonics + 1), imag = new Float32Array(harmonics + 1);
    for (let n = 1; n <= harmonics; n++) imag[n] = Math.pow(n, -1.6) * (n % 7 === 0 ? 0.3 : 1);
    this.#wave = ctx.createPeriodicWave(real, imag);
    const length = Math.floor(ctx.sampleRate * 0.06);
    this.#noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = this.#noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    this.#ctx = ctx;
    return ctx;
  }

  attack(midi: number, velocity: number) {
    const ctx = this.#context();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    this.#stop(this.#voices.get(midi), 0.02);
    this.#voices.delete(midi);
    if (this.#voices.size >= MAX_VOICES) {
      const [oldest, voice] = this.#voices.entries().next().value!;
      this.#voices.delete(oldest);
      this.#stop(voice, 0.05);
    }
    const t = ctx.currentTime, f = 440 * Math.pow(2, (midi - 69) / 12), register = (midi - 21) / 87;
    const peak = 0.16 * Math.pow(velocity, 1.4) * (1.15 - register * 0.4);
    const sustain = 3.2 - register * 2.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.004);
    gain.gain.setTargetAtTime(peak * 0.4, t + 0.004, 0.12);
    gain.gain.setTargetAtTime(0.0001, t + 0.25, sustain);
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.Q.value = 0.6;
    tone.frequency.setValueAtTime(Math.min(16000, f * (6 + velocity * 10)), t);
    tone.frequency.setTargetAtTime(Math.min(12000, f * 2.5 + 300), t + 0.01, 0.35 + sustain * 0.15);
    tone.connect(gain).connect(this.#out!);
    const sources: AudioScheduledSourceNode[] = [];
    for (const cents of [-1.2, 1.4]) {
      const string = ctx.createOscillator();
      string.setPeriodicWave(this.#wave!);
      string.frequency.value = f;
      string.detune.value = cents;
      string.connect(tone);
      string.start(t);
      string.stop(t + 0.25 + sustain * 7);
      sources.push(string);
    }
    const hammer = ctx.createBufferSource();
    hammer.buffer = this.#noise;
    const knock = ctx.createBiquadFilter();
    knock.type = 'bandpass';
    knock.frequency.value = Math.min(5000, f * 4 + 600);
    knock.Q.value = 1.2;
    const knockGain = ctx.createGain();
    knockGain.gain.value = peak * 0.5;
    hammer.connect(knock).connect(knockGain).connect(gain);
    hammer.start(t);
    sources.push(hammer);
    const voice: Voice = { gain, sources, nodes: [gain, tone, knock, knockGain] };
    sources[0].onended = () => this.#free(voice);
    this.#voices.set(midi, voice);
  }

  release(midi: number) {
    const voice = this.#voices.get(midi);
    if (!voice) return;
    this.#voices.delete(midi);
    this.#stop(voice, 0.09);
  }

  releaseAll() {
    for (const midi of [...this.#voices.keys()]) this.release(midi);
  }

  dispose() {
    this.#voices.clear();
    this.#ctx?.close().catch(() => {});
    this.#ctx = null;
  }

  #stop(voice: Voice | undefined, damper: number) {
    if (!voice || !this.#ctx) return;
    const t = this.#ctx.currentTime, gain = voice.gain.gain;
    gain.cancelScheduledValues(t);
    gain.setValueAtTime(gain.value, t);
    gain.setTargetAtTime(0, t, damper);
    voice.sources.forEach((source) => { try { source.stop(t + damper * 8); } catch {} });
  }

  #free(voice: Voice) {
    voice.sources.forEach((source) => source.disconnect());
    voice.nodes.forEach((node) => node.disconnect());
  }
}
