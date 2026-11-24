/**
 * Ambient soundscapes synthesised live with the Web Audio API (no audio files, no network).
 * These are generated sounds and are labelled as such in the UI.
 */
export type AmbientKind = 'off' | 'brown' | 'pink' | 'rain' | 'ocean' | 'drone';
export const AMBIENTS: { id: AmbientKind; label: string }[] = [
  { id: 'off', label: 'Off' }, { id: 'brown', label: 'Deep noise' }, { id: 'pink', label: 'Soft noise' },
  { id: 'rain', label: 'Rain' }, { id: 'ocean', label: 'Ocean' }, { id: 'drone', label: 'Low drone' },
];

class Ambient {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  private master: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private stops: (() => void)[] = [];
  kind: AmbientKind = 'off';
  volume = 0.35;

  private ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 256;
      this.master.connect(this.analyser); this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private noise(type: 'brown' | 'pink' | 'white') {
    const ctx = this.ctx!; const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else if (type === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        } else d[i] = w * 0.5;
      }
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.start();
    this.stops.push(() => src.stop());
    return src;
  }

  private lfo(target: AudioParam, rate: number, depth: number) {
    const ctx = this.ctx!; const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = rate; g.gain.value = depth; o.connect(g); g.connect(target); o.start();
    this.stops.push(() => o.stop()); this.nodes.push(o, g);
  }

  play(kind: AmbientKind) {
    this.stop();
    this.kind = kind;
    if (kind === 'off') return;
    const ctx = this.ensure(); const out = this.master!;
    out.gain.cancelScheduledValues(ctx.currentTime);
    out.gain.setValueAtTime(0, ctx.currentTime);
    out.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 2);
    const chain = (src: AudioNode, ...fx: AudioNode[]) => { let n = src; for (const f of fx) { n.connect(f); n = f; } n.connect(out); this.nodes.push(src, ...fx); };

    if (kind === 'brown' || kind === 'pink') {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = kind === 'brown' ? 900 : 2500;
      chain(this.noise(kind), lp);
    } else if (kind === 'rain') {
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000;
      const g = ctx.createGain(); g.gain.value = 0.35; this.lfo(g.gain, 0.13, 0.08);
      chain(this.noise('pink'), hp, lp, g);
    } else if (kind === 'ocean') {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; this.lfo(lp.frequency, 0.08, 450);
      const g = ctx.createGain(); g.gain.value = 0.55; this.lfo(g.gain, 0.08, 0.45);
      chain(this.noise('brown'), lp, g);
    } else if (kind === 'drone') {
      [110, 164.81, 220.5].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.start(); this.stops.push(() => o.stop());
        const g = ctx.createGain(); g.gain.value = 0.12 / (i + 1); this.lfo(g.gain, 0.05 + i * 0.03, 0.04);
        chain(o, g);
      });
    }
  }

  setVolume(v: number) { this.volume = v; if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.2); }

  fadeOut(seconds = 8) {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, seconds / 4);
    setTimeout(() => this.stop(), seconds * 1000);
  }

  stop() {
    this.stops.forEach((s) => { try { s(); } catch { /* already stopped */ } });
    this.nodes.forEach((n) => { try { n.disconnect(); } catch { /* */ } });
    this.stops = []; this.nodes = []; this.kind = 'off';
  }
}
export const ambient = new Ambient();

/** A short chime via Web Audio — used by timers. */
export function chime() {
  try {
    const ctx = ambient.ctx || new AudioContext();
    [528, 792].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.25);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.25 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.25 + 1.6);
      o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime + i * 0.25); o.stop(ctx.currentTime + i * 0.25 + 1.7);
    });
  } catch { /* audio unavailable */ }
}
