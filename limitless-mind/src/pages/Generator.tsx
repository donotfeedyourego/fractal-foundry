import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Save, Sparkles } from 'lucide-react';
import { generateSession, GenInput } from '../content/generator';
import { askAI, extractJSON } from '../lib/ai';
import { useTable } from '../lib/hooks';
import { Badge, Button, Card, Field, Notice, PageHeader } from '../components/ui';
import type { Chapter } from '../lib/types';
import { usePrefs } from '../lib/prefs';

export default function Generator() {
  const nav = useNavigate();
  const { prefs } = usePrefs();
  const sessions = useTable('hypnosis_sessions');
  const [inp, setInp] = useState<GenInput>({ improve: '', behaviour: '', achieve: '', minutes: prefs.session_length || 15, tone: 'calm', style: 'relaxing' });
  const [out, setOut] = useState<{ title: string; chapters: Chapter[]; reflection: string[]; source: 'template' | 'generated' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const valid = inp.improve.trim().length >= 3;
  const gen = async (useAI: boolean) => {
    if (!valid) return setErr('Describe what you want to improve (at least a few words).');
    setErr(null); setNotice(null); setBusy(true);
    if (useAI) {
      const r = await askAI('hypnosis', [{ role: 'user', content: JSON.stringify(inp) }], { format: 'json' });
      const parsed = !r.demo ? extractJSON<{ title: string; chapters: Chapter[]; reflection: string[] }>(r.text) : null;
      if (parsed?.chapters?.length) { setOut({ ...parsed, reflection: parsed.reflection || [], source: 'generated' }); setBusy(false); return; }
      setNotice(r.notice || (r.demo ? 'AI is not connected, so this session was built with the personal template generator instead.' : 'The AI response could not be read, so the template generator was used.'));
    }
    setOut({ ...generateSession(inp), source: 'template' });
    setBusy(false);
  };
  const save = async () => {
    if (!out) return;
    const row = await sessions.save({ title: out.title, category: 'Personal', objective: `Improve ${inp.improve}. Change: ${inp.behaviour || '—'}. Achieve: ${inp.achieve || '—'}.`, chapters: out.chapters, source: out.source, base_id: null, duration_min: inp.minutes, tone: inp.tone, reflection: out.reflection });
    nav(`/hypnosis/session/${row.id}`);
  };

  return (
    <div className="space-y-5">
      <Link to="/hypnosis" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="w-4 h-4" />Hypnosis Studio</Link>
      <PageHeader eyebrow="Personal Hypnosis Generator" title="A session written around you." subtitle="Describe what you want to change. Generate, edit, then save it to My sessions." />
      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-5">
        <Card className="space-y-4 h-fit">
          <Field label="What do you want to improve?" error={err}><input value={inp.improve} onChange={(e) => setInp({ ...inp, improve: e.target.value })} placeholder="e.g. my focus when studying" maxLength={120} /></Field>
          <Field label="What behaviour do you want to change?"><input value={inp.behaviour} onChange={(e) => setInp({ ...inp, behaviour: e.target.value })} placeholder="e.g. checking my phone every few minutes" maxLength={120} /></Field>
          <Field label="What do you want to achieve?"><input value={inp.achieve} onChange={(e) => setInp({ ...inp, achieve: e.target.value })} placeholder="e.g. passing my certification exam" maxLength={120} /></Field>
          <Field label={`Length: about ${inp.minutes} minutes`}><input type="range" min={5} max={30} step={5} value={inp.minutes} onChange={(e) => setInp({ ...inp, minutes: +e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tone"><select value={inp.tone} onChange={(e) => setInp({ ...inp, tone: e.target.value as GenInput['tone'] })}><option value="calm">Calm</option><option value="warm">Warm</option><option value="direct">Direct</option><option value="gentle">Gentle</option></select></Field>
            <Field label="Experience"><select value={inp.style} onChange={(e) => setInp({ ...inp, style: e.target.value as GenInput['style'] })}><option value="relaxing">Relaxing</option><option value="motivational">Motivational</option><option value="reflective">Reflective</option><option value="confidence">Confidence-building</option></select></Field>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => gen(true)} loading={busy}><Sparkles className="w-4 h-4" />Generate with AI</Button>
            <Button variant="outline" onClick={() => gen(false)} disabled={busy}>Use template generator</Button>
          </div>
          <p className="text-xs text-muted">The template generator works offline. AI generation requires the AI backend (Settings → AI).</p>
        </Card>
        <div className="space-y-3">
          {notice && <Notice>{notice}</Notice>}
          {out ? (
            <Card className="space-y-4">
              <div className="flex items-center gap-2"><Badge tone="gold">{out.source === 'generated' ? 'AI generated' : 'Template generated'}</Badge></div>
              <input value={out.title} onChange={(e) => setOut({ ...out, title: e.target.value })} className="!text-xl font-display" aria-label="Title" />
              {out.chapters.map((c, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="text-gold font-display text-lg">{i + 1}. {c.title}</div>
                  <textarea rows={5} value={c.text} onChange={(e) => setOut({ ...out, chapters: out.chapters.map((d, j) => j === i ? { ...d, text: e.target.value } : d) })} aria-label={c.title} />
                </div>
              ))}
              <div><div className="text-gold font-display text-lg">Post-session reflection</div><ul className="list-disc ml-5 text-sm text-muted">{out.reflection.map((r) => <li key={r}>{r}</li>)}</ul></div>
              <div className="flex gap-2"><Button variant="outline" onClick={() => gen(out.source === 'generated')} loading={busy}><RefreshCw className="w-4 h-4" />Regenerate</Button><div className="flex-1" /><Button onClick={save}><Save className="w-4 h-4" />Save session</Button></div>
            </Card>
          ) : <Card className="text-center py-16 text-muted"><Sparkles className="w-8 h-8 mx-auto text-gold mb-3" />Your personalised script will appear here: introduction, relaxation, visualisation, affirmations, behavioural suggestions, future-self rehearsal, return and reflection.</Card>}
        </div>
      </div>
    </div>
  );
}
