import { useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Lock, NotebookPen, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Empty, Field, LinkButton, Markdown, Notice, PageHeader, Spinner } from '../components/ui';
import { useTable } from '../lib/hooks';
import { TEMPLATES, getTemplate } from '../content/journal';
import { cx, download, fmtDate, today } from '../lib/util';
import { askAI } from '../lib/ai';
import { logActivity, usePrefs } from '../lib/prefs';
import type { JournalEntry } from '../lib/types';

export default function Journal() {
  return (
    <Routes>
      <Route index element={<List />} />
      <Route path="new" element={<Editor />} />
      <Route path=":id" element={<Editor />} />
    </Routes>
  );
}

function List() {
  const j = useTable('journal_entries');
  const [q, setQ] = useState(''); const [kind, setKind] = useState('all'); const [tag, setTag] = useState('');
  const tags = useMemo(() => Array.from(new Set(j.rows.flatMap((e) => e.tags))).sort(), [j.rows]);
  const list = [...j.rows].filter((e) => (kind === 'all' || e.kind === kind) && (!tag || e.tags.includes(tag)) &&
    (!q || `${e.title} ${e.body} ${Object.values(e.answers).join(' ')} ${e.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (b.entry_date + b.created_at).localeCompare(a.entry_date + a.created_at));
  const exportMd = () => download(`journal-${today()}.md`, j.rows.map((e) => `# ${e.title || 'Untitled'}\n_${e.entry_date} · ${getTemplate(e.kind).label}${e.tags.length ? ' · ' + e.tags.map((t) => '#' + t).join(' ') : ''}_\n\n${Object.entries(e.answers).filter(([, v]) => v).map(([k, v]) => `**${k}**\n${v}`).join('\n\n')}${e.body ? '\n\n' + e.body : ''}\n`).join('\n---\n\n'), 'text/markdown');
  const exportJson = () => download(`journal-${today()}.json`, JSON.stringify(j.rows, null, 2));
  return (
    <div>
      <PageHeader eyebrow="Journal & Knowledge Vault" title="Think on paper." subtitle="Daily entries, dreams, ideas, reflections and lessons learned. Private to you."
        actions={<><LinkButton to="/journal/new" variant="gold"><Plus className="w-4 h-4" />New entry</LinkButton>{j.rows.length > 0 && <><Button variant="outline" onClick={exportMd}><Download className="w-4 h-4" />Markdown</Button><Button variant="ghost" onClick={exportJson}>JSON</Button></>}</>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
        {TEMPLATES.filter((t) => ['morning', 'evening', 'dream', 'idea', 'free'].includes(t.id)).map((t) => <Link key={t.id} to={`/journal/new?template=${t.id}`} className="card p-3 hover:border-gold/50 text-sm"><NotebookPen className="w-4 h-4 text-gold mb-1" />{t.label}</Link>)}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-3.5 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search entries" className="!pl-9" aria-label="Search" /></div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="sm:!w-48" aria-label="Type"><option value="all">All types</option>{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}<option value="reflection">Reflection</option></select>
        {tags.length > 0 && <select value={tag} onChange={(e) => setTag(e.target.value)} className="sm:!w-40" aria-label="Tag"><option value="">All tags</option>{tags.map((t) => <option key={t}>{t}</option>)}</select>}
      </div>
      {j.loading ? <Spinner /> : list.length ? (
        <div className="space-y-2">{list.map((e) => (
          <Link key={e.id} to={`/journal/${e.id}`} className="card p-4 flex gap-4 hover:border-gold/40 transition">
            <div className="text-center w-12 shrink-0"><div className="text-2xl font-display leading-none">{new Date(e.entry_date + 'T12:00').getDate()}</div><div className="text-[10px] uppercase text-muted">{new Date(e.entry_date + 'T12:00').toLocaleDateString(undefined, { month: 'short' })}</div></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><span className="font-medium truncate">{e.title || 'Untitled entry'}</span>{e.is_private && <Lock className="w-3.5 h-3.5 text-muted" />}</div>
              <div className="text-sm text-muted truncate">{e.is_private ? 'Private note' : (Object.values(e.answers).find(Boolean) || e.body || '').slice(0, 140)}</div>
              <div className="flex gap-1 mt-1.5 flex-wrap"><Badge>{getTemplate(e.kind).id === 'free' && e.kind !== 'free' ? e.kind : getTemplate(e.kind).label}</Badge>{e.tags.map((t) => <Badge key={t} tone="gold">#{t}</Badge>)}</div>
            </div>
          </Link>))}</div>
      ) : <Empty icon={<NotebookPen className="w-5 h-5" />} title={j.rows.length ? 'No matching entries' : 'Your journal is empty'} text={j.rows.length ? 'Try a different search or filter.' : 'Start with a morning or evening template.'} />}
    </div>
  );
}

function Editor() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const j = useTable('journal_entries');
  const { prefs, update } = usePrefs();
  const existing = id ? j.rows.find((e) => e.id === id) : undefined;
  if (id && j.loading) return <Spinner />;
  if (id && !existing) return <Empty title="Entry not found" action={<LinkButton to="/journal">Back to journal</LinkButton>} />;
  return <EditorForm key={id || 'new'} existing={existing} initialTemplate={sp.get('template') || 'free'} sessionTitle={sp.get('session')} titleParam={sp.get('title')}
    onSave={async (e) => { const row = await j.save(e); if (!existing) logActivity('journal', 0, row.id); nav(`/journal/${row.id}`, { replace: true }); }}
    onDelete={existing ? async () => { if (confirm('Delete this entry permanently?')) { await j.remove(existing.id); nav('/journal'); } } : undefined}
    consent={prefs.journal_ai_consent} grantConsent={() => update({ journal_ai_consent: true })} />;
}

function EditorForm({ existing, initialTemplate, sessionTitle, titleParam, onSave, onDelete, consent, grantConsent }: {
  existing?: JournalEntry; initialTemplate: string; sessionTitle: string | null; titleParam: string | null;
  onSave: (e: Partial<JournalEntry>) => Promise<void>; onDelete?: () => void; consent: boolean; grantConsent: () => void;
}) {
  const kind = existing?.kind || initialTemplate;
  const tpl = getTemplate(kind);
  const defaultTitle = existing?.title ?? (sessionTitle ? `Reflection: ${sessionTitle}` : titleParam ? `Lesson: ${titleParam}` : kind === 'morning' ? `Morning · ${fmtDate(today())}` : kind === 'evening' ? `Evening · ${fmtDate(today())}` : kind === 'dream' ? `Dream · ${fmtDate(today())}` : '');
  const [f, setF] = useState({
    title: defaultTitle, body: existing?.body || '', answers: existing?.answers || (sessionTitle ? { 'Which session did I complete?': sessionTitle } : {}),
    tags: (existing?.tags || []).join(', '), mood: existing?.mood ?? null, is_private: existing?.is_private || false, entry_date: existing?.entry_date || today(),
  });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const [ai, setAi] = useState<{ text: string; demo: boolean } | null>(null); const [aiBusy, setAiBusy] = useState(false);
  const questions = tpl.questions.length ? tpl.questions : Object.keys(f.answers);
  const save = async () => {
    const hasContent = f.body.trim() || Object.values(f.answers).some((v) => v?.trim());
    if (!hasContent) return setErr('Write something before saving.');
    setBusy(true); setErr(null);
    try { await onSave({ ...(existing ? { id: existing.id } : {}), kind, title: f.title.trim(), body: f.body, answers: f.answers, tags: f.tags.split(',').map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean), mood: f.mood, is_private: f.is_private, entry_date: f.entry_date }); }
    catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const reflect = async () => {
    setAiBusy(true);
    const content = `${f.title}\n${Object.entries(f.answers).map(([k, v]) => `${k}: ${v}`).join('\n')}\n${f.body}`;
    const r = await askAI('reflect', [{ role: 'user', content }], { kind });
    setAi({ text: r.text, demo: r.demo }); setAiBusy(false);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Link to="/journal" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="w-4 h-4" />Journal</Link>
      <div className="flex items-center gap-2"><Badge tone="gold">{tpl.label}</Badge>{existing && <span className="text-xs text-muted">Last edited {fmtDate(existing.updated_at)}</span>}</div>
      <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Title" className="!text-2xl font-display !bg-transparent !border-0 !px-0" aria-label="Title" maxLength={120} />
      <Card className="space-y-4">
        {questions.map((q) => <Field key={q} label={q}><textarea rows={kind === 'dream' && q.startsWith('What happened') ? 5 : 2} value={f.answers[q] || ''} onChange={(e) => setF({ ...f, answers: { ...f.answers, [q]: e.target.value } })} /></Field>)}
        <Field label={questions.length ? 'Anything else' : 'Write freely'}><textarea rows={questions.length ? 4 : 12} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Tags (comma separated)"><input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="ideas, business" /></Field>
          <Field label="Date"><input type="date" value={f.entry_date} onChange={(e) => setF({ ...f, entry_date: e.target.value })} /></Field>
          <Field label="Mood"><div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => setF({ ...f, mood: f.mood === n ? null : n })} className={cx('flex-1 h-10 rounded-lg', f.mood != null && n <= f.mood ? 'bg-gold/80 text-black' : 'bg-raised text-muted')} aria-label={`Mood ${n}`}>{n}</button>)}</div></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_private} onChange={(e) => setF({ ...f, is_private: e.target.checked })} /><Lock className="w-3.5 h-3.5" />Private note: hidden from previews and never sent to AI</label>
        {err && <Notice tone="bad">{err}</Notice>}
        <div className="flex gap-2"><Button onClick={save} loading={busy}>Save entry</Button>{onDelete && <Button variant="danger" onClick={onDelete}><Trash2 className="w-4 h-4" />Delete</Button>}</div>
      </Card>
      {existing && !f.is_private && (
        <Card>
          <div className="flex justify-between items-center"><h3 className="text-xl">AI-assisted reflection</h3>{consent ? <Button size="sm" variant="outline" onClick={reflect} loading={aiBusy}><Sparkles className="w-4 h-4" />Reflect</Button> : null}</div>
          {!consent ? <div className="mt-2 space-y-2"><p className="text-sm text-muted">With your permission, this entry’s text is sent to The Architect (via your secure backend) to generate reflection questions. Private notes are never sent.</p><Button size="sm" onClick={grantConsent}>Allow AI reflection on my journal</Button></div>
            : ai && <div className="mt-3 text-sm"><Markdown text={ai.text} /><p className="text-[11px] text-muted mt-3">Interpretations are possibilities to explore, not established facts.</p></div>}
        </Card>
      )}
    </div>
  );
}
