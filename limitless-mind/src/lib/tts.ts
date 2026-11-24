/**
 * Browser text-to-speech engine for scripts. Speaks sentence by sentence so we can
 * pause/resume reliably on every browser, skip, change speed live and sync the script view.
 * "[pause]" in a script inserts a 3-second silence.
 */
export interface Segment { chapter: number; text: string; pause: boolean }

export function segment(chapters: { text: string }[]): Segment[] {
  const out: Segment[] = [];
  chapters.forEach((c, ci) => {
    c.text.split(/\n+/).forEach((para) => {
      para.split(/(\[pause\])/i).forEach((part) => {
        if (/^\[pause\]$/i.test(part)) { out.push({ chapter: ci, text: '', pause: true }); return; }
        (part.match(/[^.!?…]+[.!?…]+["'”’)]*|[^.!?…]+$/g) || []).map((s) => s.trim()).filter(Boolean)
          .forEach((s) => out.push({ chapter: ci, text: s, pause: false }));
      });
    });
  });
  return out;
}

export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function listVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!ttsSupported()) return Promise.resolve([]);
  const v = speechSynthesis.getVoices();
  if (v.length) return Promise.resolve(v);
  return new Promise((res) => {
    const t = setTimeout(() => res(speechSynthesis.getVoices()), 1500);
    speechSynthesis.onvoiceschanged = () => { clearTimeout(t); res(speechSynthesis.getVoices()); };
  });
}

export class ScriptSpeaker {
  segs: Segment[] = [];
  index = 0;
  playing = false;
  rate = 0.9;
  volume = 1;
  pitch = 0.95;
  voice: SpeechSynthesisVoice | null = null;
  onChange: () => void = () => {};
  onEnd: () => void = () => {};
  onWord: () => void = () => {};
  private token = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  load(segs: Segment[], start = 0) { this.stop(); this.segs = segs; this.index = Math.min(start, Math.max(0, segs.length - 1)); this.onChange(); }

  play() {
    if (!ttsSupported() || !this.segs.length) return;
    if (this.index >= this.segs.length) this.index = 0;
    this.playing = true; this.speakCurrent(); this.onChange();
  }
  pause() { this.playing = false; this.token++; this.clear(); speechSynthesis.cancel(); this.onChange(); }
  stop() { this.pause(); }
  seek(i: number) {
    const was = this.playing; this.pause();
    this.index = Math.max(0, Math.min(this.segs.length - 1, i)); this.onChange();
    if (was) this.play();
  }
  skip(n: number) { this.seek(this.index + n); }
  setRate(r: number) { this.rate = r; if (this.playing) this.seek(this.index); }
  setVolume(v: number) { this.volume = v; if (this.playing) this.seek(this.index); }
  setVoice(v: SpeechSynthesisVoice | null) { this.voice = v; if (this.playing) this.seek(this.index); }

  private clear() { if (this.timer) clearTimeout(this.timer); this.timer = null; }

  private next(tok: number) {
    if (tok !== this.token || !this.playing) return;
    this.index++;
    if (this.index >= this.segs.length) { this.playing = false; this.index = this.segs.length; this.onChange(); this.onEnd(); return; }
    this.onChange(); this.speakCurrent();
  }

  private speakCurrent() {
    const tok = ++this.token;
    const seg = this.segs[this.index];
    if (!seg) return;
    if (seg.pause) { this.timer = setTimeout(() => this.next(tok), 3000 / this.rate); return; }
    const u = new SpeechSynthesisUtterance(seg.text);
    u.rate = this.rate; u.volume = this.volume; u.pitch = this.pitch;
    if (this.voice) u.voice = this.voice;
    u.onboundary = () => this.onWord();
    u.onend = () => { this.timer = setTimeout(() => this.next(tok), 450 / this.rate); };
    u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') this.next(tok); };
    speechSynthesis.speak(u);
  }
}
