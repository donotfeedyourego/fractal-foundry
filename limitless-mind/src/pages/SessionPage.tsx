import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Heart, NotebookPen, Pencil, Play, Save, Wand2, Mic } from 'lucide-react';
import { getProgramme } from '../content/hypnosis';
import { useTable } from '../lib/hooks';
import { player, usePlayer } from '../lib/player';
import { Badge, Button, Card, Empty, LinkButton, Notice, Spinner } from '../components/ui';
import { FullPlayer } from '../components/Player';
import { Recorder } from '../components/AudioLibrary';
import { SAFETY } from './Hypnosis';
import { saveAudio, synthesizeExternal } from '../lib/media';
import { estimateSeconds, fmtTime } from '../lib/player';
import { segment } from '../lib/tts';
import type { Chapter } from '../lib/types';

export default function SessionPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const p = usePlayer();
  const personal = useTable('hypnosis_sessions');
  const progress = useTable('session_progress');
  const builtin = getProgramme(id);
  const mine = personal.rows.find((s) => s.id === id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Chapter[]>([]);
  const [title, setTitle] = useState('');
  const [tts, setTts] = useState<{ busy: boolean; msg: string | null }>({ busy: false, msg: null });
  const [showRec, setShowRec] = useState(false);

  if (!builtin && personal.loading) return <Spinner />;
  if (!builtin && !mine) return <Empty title="Session not found" action={<LinkButton to="/hypnosis">Back to studio</LinkButton>} />;

  const s = builtin
    ? { id: builtin.id, title: builtin.title, subtitle: builtin.subtitle, objective: builtin.objective, category: builtin.category, chapters: builtin.chapters, reflection: builtin.reflection }
    : { id: mine!.id, title: mine!.title, subtitle: undefined, objective: mine!.objective, category: mine!.category, chapters: mine!.chapters, reflection: mine!.reflection };
  const prog = progress.rows.find((r) => r.session_id === s.id);
  const loaded = p.session?.id === s.id;
  const minutes = Math.round(estimateSeconds(segment(s.chapters), p.speaker.rate) / 60);

  const start = () => player.load({ id: s.id, title: s.title, chapters: s.chapters, category: s.category });
  const toggleFav = () => progress.save(prog ? { id: prog.id, favourite: !prog.favourite } : { session_id: s.id, favourite: true, chapter: 0, char_index: 0, completed_count: 0, last_played_at: null, seconds_listened: 0 });
  const copy = async () => {
    const row = await personal.save({ title: `${s.title} (my version)`, category: s.category, objective: s.objective, chapters: s.chapters.map((c) => ({ ...c })), source: 'edited_copy', base_id: s.id, duration_min: minutes, tone: '', reflection: s.reflection });
    nav(`/hypnosis/session/${row.id}`);
  };
  const beginEdit = () => { setDraft(s.chapters.map((c) => ({ ...c }))); setTitle(s.title); setEditing(true); };
  const saveEdit = async () => {
    if (!title.trim()) return;
    await personal.save({ id: mine!.id, title: title.trim(), chapters: draft.filter((c) => c.title.trim() || c.text.trim()) });
    if (loaded) player.close();
    setEditing(false);
  };
  const generateAudio = async () => {
    setTts({ busy: true, msg: null });
    try {
      const parts: Blob[] = [];
      for (const c of s.chapters) {
        const b = await synthesizeExternal(c.text.replace(/\[pause\]/gi, '...'));
        if (!b) { setTts({ busy: false, msg: 'External TTS is not configured. Add a TTS provider key to the Supabase “tts” function (see README). Browser voice playback still works.' }); return; }
        parts.push(b);
      }
      const blob = new Blob(parts, { type: 'audio/mpeg' });
      await saveAudio(blob, { title: s.title, kind: 'generated', duration_sec: Math.round(estimateSeconds(segment(s.chapters), 1)), session_id: s.id });
      setTts({ busy: false, msg: 'Audio generated and saved to your Audio library, where you can download it.' });
    } catch (e) { setTts({ busy: false, msg: (e as Error).message }); }
  };

  return (
    <div className="space-y-6">
      <Link to="/hypnosis" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="w-4 h-4" />Hypnosis Studio</Link>
      <header className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <div className="flex gap-2 flex-wrap">{s.subtitle && <Badge tone="gold">{s.subtitle}</Badge>}<Badge>{s.category}</Badge>{mine && <Badge tone="gold">{mine.source === 'edited_copy' ? 'Your edited copy' : 'Personal session'}</Badge>}</div>
          <h1 className="text-4xl md:text-5xl font-semibold mt-2">{s.title}</h1>
          <p className="text-muted mt-2 max-w-2xl">{s.objective}</p>
          <div className="text-xs text-muted mt-2">≈ {minutes} min at current speed · {s.chapters.length} chapters{prog?.completed_count ? ` · completed ${prog.completed_count}×` : ''}{prog?.seconds_listened ? ` · ${fmtTime(prog.seconds_listened)} listened` : ''}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={toggleFav} aria-pressed={!!prog?.favourite}><Heart className={prog?.favourite ? 'w-4 h-4 fill-gold text-gold' : 'w-4 h-4'} />{prog?.favourite ? 'Favourite' : 'Favourite'}</Button>
          {builtin ? <Button variant="outline" onClick={copy}><Copy className="w-4 h-4" />Edit a personal copy</Button> : !editing && <Button variant="outline" onClick={beginEdit}><Pencil className="w-4 h-4" />Edit</Button>}
          {!loaded && !editing && <Button onClick={start}><Play className="w-4 h-4" />{prog?.char_index ? 'Resume' : 'Begin session'}</Button>}
        </div>
      </header>

      {builtin && <Notice tone="muted">The original script is preserved. “Edit a personal copy” creates your own editable version.</Notice>}

      {editing ? (
        <Card className="space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="!text-xl font-display" aria-label="Title" />
          <p className="text-xs text-muted">Tip: type [pause] to insert a three-second silence.</p>
          {draft.map((c, i) => (
            <div key={i} className="space-y-2 p-3 rounded-xl bg-raised/40">
              <input value={c.title} onChange={(e) => setDraft(draft.map((d, j) => j === i ? { ...d, title: e.target.value } : d))} aria-label="Chapter title" />
              <textarea rows={6} value={c.text} onChange={(e) => setDraft(draft.map((d, j) => j === i ? { ...d, text: e.target.value } : d))} aria-label="Chapter text" />
              <button className="text-xs text-bad" onClick={() => setDraft(draft.filter((_, j) => j !== i))}>Remove chapter</button>
            </div>
          ))}
          <div className="flex gap-2"><Button variant="outline" onClick={() => setDraft([...draft, { title: 'New chapter', text: '' }])}>Add chapter</Button><div className="flex-1" /><Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={saveEdit}><Save className="w-4 h-4" />Save</Button></div>
        </Card>
      ) : loaded ? <FullPlayer /> : (
        <Card>
          <h3 className="text-xl mb-3">Script preview</h3>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {s.chapters.map((c) => <div key={c.title}><div className="text-gold font-display text-lg">{c.title}</div><p className="text-sm text-muted whitespace-pre-line mt-1">{c.text.replace(/\s*\[pause\]\s*/gi, ' … ')}</p></div>)}
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-xl mb-2">Reflection</h3>
          <ul className="list-disc ml-5 text-sm text-muted space-y-1">{s.reflection.map((q) => <li key={q}>{q}</li>)}</ul>
          <LinkButton to={`/journal/new?template=hypnosis&session=${encodeURIComponent(s.title)}`} size="sm" className="mt-4"><NotebookPen className="w-4 h-4" />Write reflection</LinkButton>
        </Card>
        <Card className="space-y-3">
          <h3 className="text-xl">Audio options</h3>
          <p className="text-sm text-muted">Playback above uses your browser’s built-in voice. For a downloadable file, record your own reading or generate one with an external TTS provider.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRec(!showRec)}><Mic className="w-4 h-4" />Record my voice</Button>
            <Button variant="outline" size="sm" onClick={generateAudio} loading={tts.busy}><Wand2 className="w-4 h-4" />Generate audio file</Button>
          </div>
          {showRec && <Recorder sessionId={s.id} onSaved={() => setTts({ busy: false, msg: 'Recording saved to your Audio library.' })} />}
          {tts.msg && <Notice>{tts.msg}</Notice>}
        </Card>
      </div>
      <Notice tone="muted">{SAFETY}</Notice>
    </div>
  );
}
