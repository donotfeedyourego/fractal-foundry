import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, SkipBack, SkipForward, X, Rewind, FastForward, Volume2, Moon } from 'lucide-react';
import { fmtTime, player, usePlayer } from '../lib/player';
import { AMBIENTS, ambient, AmbientKind } from '../lib/ambient';
import { listVoices, ttsSupported } from '../lib/tts';
import { cx } from '../lib/util';

export function MiniPlayer() {
  const p = usePlayer();
  if (!p.session) return null;
  return (
    <div className="fixed z-40 inset-x-2 bottom-[68px] md:bottom-4 md:left-auto md:right-6 md:w-[380px] card p-3 flex items-center gap-3 shadow-2xl fade-in">
      <Visualiser small />
      <Link to={`/hypnosis/session/${p.session.id}`} className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{p.session.title}</div>
        <div className="text-xs text-muted truncate">{p.session.chapters[p.chapter]?.title} · {fmtTime(p.elapsedSeconds)} / {fmtTime(p.totalSeconds)}</div>
      </Link>
      <button onClick={() => p.toggle()} className="w-10 h-10 rounded-full bg-gold text-black grid place-items-center" aria-label={p.playing ? 'Pause' : 'Play'}>
        {p.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <button onClick={() => p.close()} className="p-1.5 text-muted hover:text-ink" aria-label="Close player"><X className="w-4 h-4" /></button>
    </div>
  );
}

/** Breathing orb: pulses with each spoken word and with the ambient audio level. */
export function Visualiser({ small }: { small?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const p = usePlayer();
  const pulseRef = useRef(0);
  useEffect(() => { pulseRef.current = 1; }, [p.pulse]);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!; let raf = 0; let t = 0;
    const data = new Uint8Array(128);
    const draw = () => {
      const size = c.width; const mid = size / 2;
      ctx.clearRect(0, 0, size, size);
      let level = 0;
      if (ambient.analyser && ambient.kind !== 'off') { ambient.analyser.getByteFrequencyData(data); level = data.reduce((a, b) => a + b, 0) / data.length / 255; }
      pulseRef.current *= 0.92;
      t += player.playing ? 0.012 : 0.004;
      const breath = (Math.sin(t) + 1) / 2;
      const base = size * (small ? 0.28 : 0.22);
      const r = base + base * 0.25 * breath + base * 0.25 * pulseRef.current + base * 0.6 * level;
      const gold = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim().split(' ').join(',');
      for (let i = 3; i >= 0; i--) {
        ctx.beginPath(); ctx.arc(mid, mid, r * (1 + i * 0.28), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${gold},${0.05 + (3 - i) * 0.05})`; ctx.fill();
      }
      if (!small) {
        ctx.strokeStyle = `rgba(${gold},0.35)`; ctx.lineWidth = 1;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.02) {
          const rr = size * 0.42 + Math.sin(a * 6 + t * 3) * 4 * (player.playing ? 1 : 0.3) + level * 18 * Math.sin(a * 10);
          const x = mid + rr * Math.cos(a), y = mid + rr * Math.sin(a) * 0.5;
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [small]);
  return <canvas ref={ref} width={small ? 80 : 360} height={small ? 80 : 360} className={small ? 'w-10 h-10 shrink-0' : 'w-56 h-56 md:w-64 md:h-64'} aria-hidden="true" />;
}

export function FullPlayer() {
  const p = usePlayer();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState('');
  useEffect(() => { listVoices().then((v) => setVoices(v.filter((x) => x.lang.startsWith(navigator.language.slice(0, 2)) || x.lang.startsWith('en')))); }, []);
  const scriptRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scriptRef.current?.querySelector('[data-current="true"]');
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [p.index]);
  if (!p.session) return null;
  const remainingSleep = p.sleepEnd ? Math.max(0, Math.round((p.sleepEnd - Date.now()) / 1000)) : null;

  return (
    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6">
      <div className="card p-6 flex flex-col items-center">
        {!ttsSupported() && <div className="text-sm text-bad mb-3">This browser does not support speech synthesis. You can still read the script, or record your own voice.</div>}
        <div className="text-[10px] tracking-[0.25em] uppercase text-gold">Browser voice · generated live</div>
        <Visualiser />
        <div className="text-center -mt-2">
          <div className="text-sm text-muted">{p.session.chapters[p.chapter]?.title}</div>
        </div>
        <div className="w-full mt-5">
          <input type="range" min={0} max={Math.max(0, p.segs.length - 1)} value={Math.min(p.index, p.segs.length - 1)} onChange={(e) => p.seek(+e.target.value)} aria-label="Seek" className="w-full" />
          <div className="flex justify-between text-xs text-muted mt-1"><span>{fmtTime(p.elapsedSeconds)}</span><span>{fmtTime(p.totalSeconds)}</span></div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button className="p-2.5 rounded-full hover:bg-raised" onClick={() => p.seekChapter(Math.max(0, p.chapter - 1))} aria-label="Previous chapter"><SkipBack className="w-5 h-5" /></button>
          <button className="p-2.5 rounded-full hover:bg-raised" onClick={() => p.skip(-3)} aria-label="Back"><Rewind className="w-5 h-5" /></button>
          <button className="w-16 h-16 rounded-full bg-gold text-black grid place-items-center shadow-lg shadow-gold/20" onClick={() => p.toggle()} aria-label={p.playing ? 'Pause' : 'Play'}>
            {p.playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
          <button className="p-2.5 rounded-full hover:bg-raised" onClick={() => p.skip(3)} aria-label="Forward"><FastForward className="w-5 h-5" /></button>
          <button className="p-2.5 rounded-full hover:bg-raised" onClick={() => p.seekChapter(Math.min(p.session!.chapters.length - 1, p.chapter + 1))} aria-label="Next chapter"><SkipForward className="w-5 h-5" /></button>
        </div>

        <div className="w-full grid grid-cols-2 gap-4 mt-6 text-sm">
          <label className="space-y-1"><span className="text-muted text-xs">Speed</span>
            <select value={p.speaker.rate} onChange={(e) => p.setRate(+e.target.value)}>
              {[0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5].map((r) => <option key={r} value={r}>{r}×</option>)}
            </select></label>
          <label className="space-y-1"><span className="text-muted text-xs flex items-center gap-1"><Moon className="w-3 h-3" />Sleep timer {remainingSleep != null && `(${fmtTime(remainingSleep)})`}</span>
            <select value={p.sleepEnd ? 'on' : ''} onChange={(e) => p.setSleep(e.target.value ? +e.target.value : null)}>
              <option value="">Off</option>{[5, 10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
              {p.sleepEnd && <option value="on" disabled>Running…</option>}
            </select></label>
          <label className="space-y-1 col-span-2"><span className="text-muted text-xs flex items-center gap-1"><Volume2 className="w-3 h-3" />Voice volume</span>
            <input type="range" min={0} max={1} step={0.05} value={p.speaker.volume} onChange={(e) => p.setVolume(+e.target.value)} /></label>
          <label className="space-y-1 col-span-2"><span className="text-muted text-xs">Voice</span>
            <select value={voiceURI} onChange={(e) => { setVoiceURI(e.target.value); p.setVoice(voices.find((v) => v.voiceURI === e.target.value) || null); }}>
              <option value="">System default</option>{voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
            </select></label>
          <label className="space-y-1"><span className="text-muted text-xs">Ambient (synthesised)</span>
            <select value={p.ambientKind} onChange={(e) => p.setAmbient(e.target.value as AmbientKind)}>
              {AMBIENTS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select></label>
          <label className="space-y-1"><span className="text-muted text-xs">Ambient volume</span>
            <input type="range" min={0} max={1} step={0.05} defaultValue={ambient.volume} onChange={(e) => p.setAmbientVolume(+e.target.value)} /></label>
        </div>
        <p className="text-[11px] text-muted mt-4 text-center">Browser speech is generated on your device and cannot be downloaded. To save an audio file, record your own voice or connect an external TTS provider.</p>
      </div>

      <div className="card p-0 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex gap-1 overflow-x-auto no-scrollbar p-3 border-b border-line shrink-0">
          {p.session.chapters.map((c, i) => (
            <button key={i} onClick={() => p.seekChapter(i)} className={cx('px-3 py-1.5 rounded-lg text-xs whitespace-nowrap', i === p.chapter ? 'bg-gold/15 text-gold' : 'text-muted hover:bg-raised')}>{c.title}</button>
          ))}
        </div>
        <div ref={scriptRef} className="overflow-y-auto p-6 leading-relaxed text-[15px] min-h-0">
          {p.segs.map((s, i) => {
            const firstOfChapter = i === 0 || p.segs[i - 1].chapter !== s.chapter;
            return (
              <span key={i}>
                {firstOfChapter && <h3 className={cx("block text-xl text-gold mb-2", i > 0 && "mt-6")}>{p.session!.chapters[s.chapter].title}</h3>}
                {s.pause ? <span className="text-muted/50 text-xs mx-1">·</span> :
                  <span role="button" tabIndex={0} data-current={i === p.index} onClick={() => p.seek(i)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), p.seek(i))} className={cx('cursor-pointer rounded px-0.5 transition', i === p.index ? 'text-ink bg-gold/15' : i < p.index ? 'text-muted' : 'text-ink/80 hover:text-ink')}>{s.text}</span>}{' '}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
