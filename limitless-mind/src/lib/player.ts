/** Global session player: keeps playing while you navigate, persists progress, sleep timer, ambient. */
import { useSyncExternalStore } from 'react';
import { ScriptSpeaker, segment, Segment, ttsSupported } from './tts';
import { ambient, AmbientKind } from './ambient';
import { store } from './store';
import { logActivity } from './prefs';
import type { Chapter } from './types';

export interface LoadedSession { id: string; title: string; chapters: Chapter[]; category?: string }

class PlayerController {
  speaker = new ScriptSpeaker();
  session: LoadedSession | null = null;
  segs: Segment[] = [];
  sleepEnd: number | null = null;
  ambientKind: AmbientKind = 'off';
  pulse = 0;
  private listeners = new Set<() => void>();
  private snapshot = 0;
  private listenStart: number | null = null;
  private secondsThisRun = 0;
  private sleepTimer: ReturnType<typeof setInterval> | null = null;
  private lastSaved = -1;

  constructor() {
    this.speaker.onChange = () => { this.trackTime(); this.maybeSave(); this.emit(); };
    this.speaker.onWord = () => { this.pulse++; this.emit(); };
    this.speaker.onEnd = () => this.complete();
    try {
      const s = JSON.parse(localStorage.getItem('lm.player') || '{}');
      if (s.rate) this.speaker.rate = s.rate;
      if (s.volume != null) this.speaker.volume = s.volume;
      if (s.ambientVol != null) ambient.volume = s.ambientVol;
    } catch { /* ignore */ }
  }

  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
  getSnapshot = () => this.snapshot;
  private emit() { this.snapshot++; this.listeners.forEach((l) => l()); }
  private persistSettings() {
    try { localStorage.setItem('lm.player', JSON.stringify({ rate: this.speaker.rate, volume: this.speaker.volume, ambientVol: ambient.volume })); } catch { /* */ }
  }

  get index() { return this.speaker.index; }
  get playing() { return this.speaker.playing; }
  get chapter() { return this.segs[Math.min(this.index, this.segs.length - 1)]?.chapter ?? 0; }
  get progress() { return this.segs.length ? Math.min(1, this.index / this.segs.length) : 0; }
  /** Estimated total seconds at current rate (≈150 wpm at 1×, plus 3 s per pause). */
  get totalSeconds() { return estimateSeconds(this.segs, this.speaker.rate); }
  get elapsedSeconds() { return estimateSeconds(this.segs.slice(0, this.index), this.speaker.rate); }

  async load(s: LoadedSession, autoplay = true) {
    if (this.session?.id === s.id && this.segs.length) { if (autoplay && !this.playing) this.play(); return; }
    this.stopTracking();
    this.session = s;
    this.segs = segment(s.chapters);
    let start = 0;
    const prog = (await store.all('session_progress')).find((p) => p.session_id === s.id);
    if (prog && prog.char_index > 0 && prog.char_index < this.segs.length - 1) start = prog.char_index;
    this.speaker.load(this.segs, start);
    this.lastSaved = start;
    if (autoplay) this.play();
    this.emit();
  }

  play() {
    if (!ttsSupported()) return;
    this.speaker.play(); this.listenStart = Date.now();
    if (this.ambientKind !== 'off' && ambient.kind === 'off') ambient.play(this.ambientKind);
    if ('mediaSession' in navigator && this.session) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: this.session.title, artist: 'The Limitless Mind' });
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
    }
  }
  pause() { this.speaker.pause(); this.trackTime(); this.save(); }
  toggle() { this.playing ? this.pause() : this.play(); }
  seek(i: number) { this.speaker.seek(i); }
  seekChapter(c: number) { const i = this.segs.findIndex((s) => s.chapter === c); if (i >= 0) this.seek(i); }
  skip(n: number) { this.speaker.skip(n); }
  setRate(r: number) { this.speaker.setRate(r); this.persistSettings(); this.emit(); }
  setVolume(v: number) { this.speaker.setVolume(v); this.persistSettings(); this.emit(); }
  setVoice(v: SpeechSynthesisVoice | null) { this.speaker.setVoice(v); this.emit(); }
  setAmbient(k: AmbientKind) { this.ambientKind = k; ambient.play(k); this.emit(); }
  setAmbientVolume(v: number) { ambient.setVolume(v); this.persistSettings(); this.emit(); }

  setSleep(minutes: number | null) {
    if (this.sleepTimer) clearInterval(this.sleepTimer);
    this.sleepEnd = minutes ? Date.now() + minutes * 60000 : null;
    if (minutes) this.sleepTimer = setInterval(() => {
      if (this.sleepEnd && Date.now() >= this.sleepEnd) {
        this.pause(); ambient.fadeOut(10); this.ambientKind = 'off'; this.sleepEnd = null;
        if (this.sleepTimer) clearInterval(this.sleepTimer);
      }
      this.emit();
    }, 1000);
    this.emit();
  }

  close() { this.pause(); ambient.stop(); this.ambientKind = 'off'; this.session = null; this.segs = []; this.setSleep(null); this.emit(); }

  private trackTime() {
    if (this.listenStart && !this.speaker.playing) { this.secondsThisRun += (Date.now() - this.listenStart) / 1000; this.listenStart = null; }
    else if (this.listenStart && this.speaker.playing) { /* still running */ }
  }
  private stopTracking() { this.trackTime(); this.save(); this.secondsThisRun = 0; }

  private maybeSave() { if (Math.abs(this.index - this.lastSaved) >= 6) this.save(); }

  private async save(completed = false) {
    if (!this.session || !store.userId) return;
    const id = this.session.id; const idx = this.index;
    this.lastSaved = idx;
    const all = await store.all('session_progress');
    const row = all.find((p) => p.session_id === id);
    const secs = Math.round(this.secondsThisRun); this.secondsThisRun = 0;
    await store.save('session_progress', {
      ...(row ? { id: row.id } : { favourite: false, completed_count: 0 }),
      session_id: id, chapter: this.chapter, char_index: completed ? 0 : idx,
      completed_count: (row?.completed_count || 0) + (completed ? 1 : 0),
      last_played_at: new Date().toISOString(), seconds_listened: (row?.seconds_listened || 0) + secs,
    }).catch(() => undefined);
    if (secs > 30) logActivity('listening', Math.round(secs / 60), id);
  }

  private complete() {
    this.trackTime();
    this.save(true);
    if (this.session) logActivity('session_complete', 0, this.session.id);
    this.emit();
  }
}

export function estimateSeconds(segs: Segment[], rate: number) {
  return segs.reduce((n, s) => n + (s.pause ? 3 : s.text.split(/\s+/).length / 2.5) / rate + 0.45, 0);
}

export const player = new PlayerController();
export function usePlayer() { useSyncExternalStore(player.subscribe, player.getSnapshot); return player; }
export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
