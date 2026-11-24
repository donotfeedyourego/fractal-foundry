import { useEffect, useRef, useState } from 'react';
import { Download, Mic, Square, Trash2, Upload, Play } from 'lucide-react';
import { useTable } from '../lib/hooks';
import { audioDuration, deleteAudio, loadAudioURL, recordingSupported, saveAudio } from '../lib/media';
import { Badge, Button, Card, Empty, Notice } from './ui';
import { fmtTime } from '../lib/player';
import { fmtDate } from '../lib/util';
import type { Recording } from '../lib/types';

const KIND_LABEL = { voice: 'Your voice', upload: 'Uploaded file', generated: 'Generated (external TTS)' } as const;

export function Recorder({ sessionId, onSaved }: { sessionId?: string; onSaved?: () => void }) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [secs, setSecs] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const start = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' });
        try {
          await saveAudio(blob, { title: title.trim() || `Recording ${new Date().toLocaleString()}`, kind: 'voice', duration_sec: secsRef.current, session_id: sessionId });
          setTitle(''); onSaved?.();
        } catch (e) { setErr((e as Error).message); }
      };
      mr.start(); setRec(mr); setSecs(0);
      timer.current = setInterval(() => setSecs((s) => { secsRef.current = s + 1; return s + 1; }), 1000);
    } catch (e) {
      setErr((e as Error).name === 'NotAllowedError' ? 'Microphone permission was denied. Allow it in your browser settings to record.' : (e as Error).message);
    }
  };
  const secsRef = useRef(0);
  const stop = () => { clearInterval(timer.current); rec?.stop(); setRec(null); };
  useEffect(() => () => clearInterval(timer.current), []);

  if (!recordingSupported()) return <Notice tone="muted">Voice recording is not supported in this browser.</Notice>;
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input placeholder="Recording title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!!rec} maxLength={80} />
        {rec ? <Button variant="danger" onClick={stop}><Square className="w-4 h-4" />Stop {fmtTime(secs)}</Button> : <Button onClick={start}><Mic className="w-4 h-4" />Record</Button>}
      </div>
      {rec && <div className="flex items-center gap-2 text-sm text-bad"><span className="w-2 h-2 rounded-full bg-bad animate-pulse" />Recording… read your script or affirmations aloud.</div>}
      {err && <Notice tone="bad">{err}</Notice>}
    </div>
  );
}

function RecordingRow({ r }: { r: Recording }) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const ref = useRef<HTMLAudioElement>(null);
  const load = async () => { try { setUrl(await loadAudioURL(r)); } catch (e) { setErr((e as Error).message); } };
  useEffect(() => { if (ref.current) ref.current.playbackRate = rate; }, [rate, url]);
  return (
    <div className="p-3 rounded-xl bg-raised/50 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0"><div className="text-sm truncate">{r.title}</div><div className="text-xs text-muted">{fmtDate(r.created_at)} · {r.duration_sec ? fmtTime(r.duration_sec) : '—'}</div></div>
        <Badge tone={r.kind === 'generated' ? 'gold' : 'muted'}>{KIND_LABEL[r.kind]}</Badge>
        <button onClick={() => confirm('Delete this audio permanently?') && deleteAudio(r)} className="p-1.5 text-muted hover:text-bad" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
      {url ? (
        <div className="flex items-center gap-2">
          <audio ref={ref} src={url} controls className="w-full h-9" autoPlay />
          <select value={rate} onChange={(e) => setRate(+e.target.value)} className="!w-20 !py-1.5" aria-label="Speed">{[0.75, 1, 1.25, 1.5].map((x) => <option key={x} value={x}>{x}×</option>)}</select>
          <a href={url} download={`${r.title}.${r.mime.includes('mpeg') ? 'mp3' : 'webm'}`} className="p-2 text-muted hover:text-gold" aria-label="Download"><Download className="w-4 h-4" /></a>
        </div>
      ) : <Button size="sm" variant="subtle" onClick={load}><Play className="w-3.5 h-3.5" />Load & play</Button>}
      {err && <div className="text-xs text-bad">{err}</div>}
    </div>
  );
}

export function AudioLibrary() {
  const recs = useTable('recordings');
  const [err, setErr] = useState<string | null>(null);
  const upload = async (f: File | undefined) => {
    if (!f) return; setErr(null);
    if (!f.type.startsWith('audio/')) return setErr('Please choose an audio file.');
    if (f.size > 50 * 1024 * 1024) return setErr('Files must be under 50 MB.');
    try { await saveAudio(f, { title: f.name.replace(/\.[^.]+$/, ''), kind: 'upload', duration_sec: await audioDuration(f) }); }
    catch (e) { setErr((e as Error).message); }
  };
  return (
    <div className="grid md:grid-cols-[1fr_1.4fr] gap-4">
      <Card className="space-y-5">
        <div><h3 className="text-xl mb-1">Record your voice</h3><p className="text-sm text-muted mb-3">Many people find their own voice the most powerful guide. Recordings stay private to you.</p><Recorder /></div>
        <div className="pt-4 border-t border-line"><h3 className="text-xl mb-1">Upload audio</h3><p className="text-sm text-muted mb-3">MP3, M4A, WAV, OGG or WebM up to 50 MB.</p>
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line hover:border-gold/60 cursor-pointer text-sm"><Upload className="w-4 h-4" />Choose file<input type="file" accept="audio/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} /></label>
          {err && <div className="mt-2"><Notice tone="bad">{err}</Notice></div>}
        </div>
      </Card>
      <Card>
        <h3 className="text-xl mb-3">Your audio</h3>
        {recs.rows.length ? <div className="space-y-2">{[...recs.rows].reverse().map((r) => <RecordingRow key={r.id} r={r} />)}</div> : <Empty icon={<Mic className="w-5 h-5" />} title="No audio yet" text="Record yourself reading a script, or upload a file." />}
      </Card>
    </div>
  );
}
