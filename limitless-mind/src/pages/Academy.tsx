import { useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Check, ChevronRight, GraduationCap, Layers, Link2, Network, Plus, Search, Send, Sparkles, Trash2, ExternalLink } from 'lucide-react';
import { ALL_LESSONS, getLesson, getSubject, LEVELS, SUBJECTS, searchLessons, Lesson, QuizQ } from '../content/academy';
import { CONCEPTS, LINKS } from '../content/connections';
import { useTable } from '../lib/hooks';
import { logActivity } from '../lib/prefs';
import { store } from '../lib/store';
import { addCards } from '../lib/srs';
import { askAI, AIMsg } from '../lib/ai';
import { Badge, Button, Card, Empty, Field, Markdown, Notice, PageHeader, Progress, SectionTitle, Spinner } from '../components/ui';
import { SubjectIcon } from '../components/Icon';
import { KnowledgeGraph } from '../components/KnowledgeGraph';
import { cx } from '../lib/util';

export default function Academy() {
  return (
    <div>
      <PageHeader eyebrow="Knowledge Academy" title="Your personal university." subtitle="Twenty departments, three levels each. Learn, test yourself, revise and connect ideas across fields." />
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-line mb-6">
        {[['/academy', 'Departments', true], ['/academy/tutor', 'AI Tutor', false], ['/academy/connect', 'Connect the Knowledge', false], ['/academy/library', 'My library', false]].map(([to, l, end]) => (
          <NavLink key={to as string} end={end as boolean} to={to as string} className={({ isActive }) => cx('px-3.5 py-2.5 text-sm border-b-2 -mb-px whitespace-nowrap', isActive ? 'border-gold' : 'border-transparent text-muted')}>{l as string}</NavLink>))}
      </div>
      <Routes>
        <Route index element={<Departments />} />
        <Route path="subject/:id" element={<SubjectPage />} />
        <Route path="lesson/:id" element={<LessonPage />} />
        <Route path="tutor" element={<Tutor />} />
        <Route path="connect" element={<Connect />} />
        <Route path="library" element={<Library />} />
      </Routes>
    </div>
  );
}

function useCompleted() { const lp = useTable('learning_progress'); return useMemo(() => new Set(lp.rows.map((r) => r.lesson_id)), [lp.rows]); }

function Departments() {
  const done = useCompleted();
  const [q, setQ] = useState('');
  const results = q.length > 2 ? searchLessons(q).slice(0, 8) : [];
  return (
    <div className="space-y-4">
      <div className="relative max-w-md"><Search className="w-4 h-4 absolute left-3 top-3.5 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons and concepts" className="!pl-9" aria-label="Search lessons" /></div>
      {results.length > 0 && <Card className="p-2">{results.map((l) => <Link key={l.id} to={`/academy/lesson/${l.id}`} className="flex justify-between p-2.5 rounded-lg hover:bg-raised text-sm"><span>{l.title}</span><span className="text-muted">{l.subjectName} · {l.level}</span></Link>)}</Card>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SUBJECTS.map((s) => {
          const n = s.lessons.filter((l) => done.has(l.id)).length;
          return (
            <Link key={s.id} to={`/academy/subject/${s.id}`} className="card p-4 hover:border-gold/50 transition group">
              <div className="flex items-center justify-between"><div className="w-10 h-10 rounded-xl bg-gold/10 text-gold grid place-items-center"><SubjectIcon name={s.icon} /></div>{n === s.lessons.length && <Badge tone="good">Complete</Badge>}</div>
              <h3 className="text-xl mt-3 group-hover:text-gold">{s.name}</h3>
              <p className="text-xs text-muted mt-0.5 line-clamp-2 min-h-[2rem]">{s.blurb}</p>
              <Progress value={(n / s.lessons.length) * 100} className="mt-3" />
              <div className="text-[11px] text-muted mt-1.5">{n}/{s.lessons.length} lessons</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SubjectPage() {
  const { id = '' } = useParams();
  const s = getSubject(id);
  const done = useCompleted();
  const modules = useTable('learning_modules');
  const resources = useTable('saved_resources');
  const [revise, setRevise] = useState(false);
  const [r, setR] = useState({ title: '', url: '' }); const [rErr, setRErr] = useState<string | null>(null);
  if (!s) return <Empty title="Subject not found" />;
  const doneLessons = s.lessons.filter((l) => done.has(l.id));
  const links = LINKS.filter((l) => l.a === s.id || l.b === s.id);
  const addResource = async () => {
    try { const u = new URL(r.url); if (!/^https?:$/.test(u.protocol)) throw new Error(); } catch { return setRErr('Enter a full URL starting with https://'); }
    if (!r.title.trim()) return setRErr('Give the resource a title.');
    await resources.save({ title: r.title.trim(), url: r.url.trim(), subject_id: s.id, note: '' }); setR({ title: '', url: '' }); setRErr(null);
  };
  if (revise) return <Revision lessons={doneLessons} subjectId={s.id} onExit={() => setRevise(false)} />;
  return (
    <div className="space-y-5">
      <Link to="/academy" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="w-4 h-4" />All departments</Link>
      <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold grid place-items-center"><SubjectIcon name={s.icon} className="w-7 h-7" /></div><div><h2 className="text-3xl">{s.name}</h2><p className="text-muted text-sm">{s.blurb}</p></div></div>
      <div className="grid md:grid-cols-3 gap-3">
        {LEVELS.map((lv, i) => {
          const l = s.lessons[i]; const isDone = done.has(l.id); const bm = modules.rows.find((m) => m.lesson_id === l.id)?.bookmarked;
          const locked = i > 0 && !done.has(s.lessons[i - 1].id);
          return (
            <Link key={lv} to={`/academy/lesson/${l.id}`} className={cx('card p-5 hover:border-gold/50 transition relative', isDone && 'border-gold/40')}>
              <div className="flex justify-between"><Badge tone={i === 0 ? 'good' : i === 1 ? 'gold' : 'bad'}>{lv}</Badge>{isDone ? <Check className="w-5 h-5 text-good" /> : bm ? <BookmarkCheck className="w-4 h-4 text-gold" /> : null}</div>
              <h3 className="text-xl mt-3">{l.title}</h3>
              <p className="text-xs text-muted mt-1">{l.minutes} min · explanation, example, exercise, {l.quiz.length}-question quiz, {l.cards.length} flashcards</p>
              {locked && <p className="text-[11px] text-muted mt-2">Recommended after the previous level</p>}
            </Link>
          );
        })}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Revision</SectionTitle>
          <p className="text-sm text-muted">Mixed questions from the lessons you have completed. Retrieval practice strengthens memory more than re-reading.</p>
          <div className="flex gap-2 mt-3"><Button size="sm" disabled={!doneLessons.length} onClick={() => setRevise(true)}><Layers className="w-4 h-4" />Start revision ({doneLessons.length * 2} questions)</Button>
            <Button size="sm" variant="outline" onClick={async () => { const n = await addCards(s.name, s.lessons.flatMap((l) => l.cards), `subject:${s.id}`); alert(n ? `${n} flashcards added to Memory training.` : 'These flashcards are already in your deck.'); }}><Plus className="w-4 h-4" />Add flashcards</Button></div>
        </Card>
        <Card>
          <SectionTitle>Connections</SectionTitle>
          <div className="space-y-2">{links.slice(0, 4).map((l) => { const other = getSubject(l.a === s.id ? l.b : l.a)!; return <div key={other.id} className="text-sm"><Link to={`/academy/subject/${other.id}`} className="text-gold">{other.name}</Link><span className="text-muted"> · {l.how}</span></div>; })}</div>
          <Link to={`/academy/connect?focus=${s.id}`} className="text-sm text-gold mt-3 inline-flex items-center gap-1"><Network className="w-4 h-4" />Open knowledge graph</Link>
        </Card>
      </div>
      <Card>
        <SectionTitle>Trusted external resources</SectionTitle>
        <p className="text-sm text-muted mb-3">Link reliable sources you use for this subject: textbooks, university courses, official documentation.</p>
        <div className="grid sm:grid-cols-[1fr_1.5fr_auto] gap-2"><input value={r.title} onChange={(e) => setR({ ...r, title: e.target.value })} placeholder="Title" aria-label="Resource title" /><input value={r.url} onChange={(e) => setR({ ...r, url: e.target.value })} placeholder="https://…" aria-label="Resource URL" /><Button onClick={addResource}><Link2 className="w-4 h-4" />Save</Button></div>
        {rErr && <p className="text-xs text-bad mt-2">{rErr}</p>}
        <div className="mt-3 space-y-1">{resources.rows.filter((x) => x.subject_id === s.id).map((x) => <div key={x.id} className="flex items-center gap-2 text-sm"><a href={x.url} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline flex items-center gap-1">{x.title}<ExternalLink className="w-3 h-3" /></a><span className="text-muted text-xs truncate">{new URL(x.url).hostname}</span><button onClick={() => resources.remove(x.id)} className="ml-auto text-muted hover:text-bad" aria-label="Remove"><Trash2 className="w-3.5 h-3.5" /></button></div>)}</div>
      </Card>
    </div>
  );
}

function Quiz({ quiz, onFinish }: { quiz: QuizQ[]; onFinish: (score: number) => void }) {
  const [ans, setAns] = useState<(number | null)[]>(() => quiz.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const score = ans.filter((a, i) => a === quiz[i].answer).length;
  return (
    <div className="space-y-4">
      {quiz.map((q, i) => (
        <div key={i}>
          <p className="font-medium text-sm">{i + 1}. {q.q}</p>
          <div className="grid sm:grid-cols-2 gap-2 mt-2">{q.options.map((o, k) => (
            <button key={k} disabled={submitted} onClick={() => setAns(ans.map((a, j) => j === i ? k : a))}
              className={cx('text-left px-3 py-2 rounded-lg border text-sm', submitted ? (k === q.answer ? 'border-good bg-good/10' : ans[i] === k ? 'border-bad bg-bad/10' : 'border-line opacity-60') : ans[i] === k ? 'border-gold bg-gold/10' : 'border-line hover:border-gold/40')}>{o}</button>))}</div>
          {submitted && <p className="text-xs text-muted mt-1.5">{q.why}</p>}
        </div>
      ))}
      {submitted ? <Notice>{score}/{quiz.length} correct{score === quiz.length ? ' — excellent.' : '. Review the explanations, then try the flashcards.'}</Notice>
        : <Button onClick={() => { setSubmitted(true); onFinish(score); }} disabled={ans.some((a) => a == null)}>Submit answers</Button>}
    </div>
  );
}

function LessonPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const l = getLesson(id);
  const lp = useTable('learning_progress');
  const modules = useTable('learning_modules');
  const [explain, setExplain] = useState<{ text: string; demo: boolean } | null>(null);
  const [exBusy, setExBusy] = useState(false);
  const [cardsMsg, setCardsMsg] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());
  if (!l) return <Empty title="Lesson not found" />;
  const mod = modules.rows.find((m) => m.lesson_id === l.id);
  const completed = lp.rows.find((r) => r.lesson_id === l.id);
  const s = getSubject(l.subjectId)!;
  const idx = s.lessons.findIndex((x) => x.id === l.id);
  const next = s.lessons[idx + 1];
  const saveMod = (patch: { notes?: string; bookmarked?: boolean }) => modules.save({ ...(mod ? { id: mod.id } : { lesson_id: l.id, subject_id: l.subjectId, notes: '', bookmarked: false }), ...patch });
  const complete = async () => {
    if (completed) return;
    const minutes = Math.max(1, Math.min(120, Math.round((Date.now() - startedAt) / 60000)) || l.minutes);
    await lp.save({ lesson_id: l.id, subject_id: l.subjectId, level: l.level, completed_at: new Date().toISOString(), minutes });
    await logActivity('learning', minutes, l.id);
  };
  const ask = async (mode: 'simpler' | 'deeper') => {
    setExBusy(true);
    const prompt = mode === 'simpler' ? `Explain "${l.title}" (${l.subjectName}) in very simple language with an everyday analogy. Base explanation: ${l.explanation}` : `Take "${l.title}" (${l.subjectName}) one level deeper than this explanation, with a worked example: ${l.explanation}`;
    const r = await askAI('tutor', [{ role: 'user', content: prompt }], { lesson: l.id, level: mode });
    setExplain({ text: r.demo ? `_Demo mode: the AI tutor is not connected. Here is the core idea restated:_\n\n${mode === 'simpler' ? l.explanation.split('. ').slice(0, 2).join('. ') + '.' : l.explanation}\n\n**Worked example:** ${l.example}` : r.text, demo: r.demo });
    setExBusy(false);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <Link to={`/academy/subject/${l.subjectId}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="w-4 h-4" />{l.subjectName}</Link>
      <div className="flex items-start justify-between gap-3">
        <div><Badge tone="gold">{l.subjectName} · {l.level}</Badge><h2 className="text-4xl mt-2">{l.title}</h2><p className="text-xs text-muted mt-1">{l.minutes} min</p></div>
        <button onClick={() => saveMod({ bookmarked: !mod?.bookmarked })} className="p-2 rounded-lg hover:bg-raised" aria-label={mod?.bookmarked ? 'Remove bookmark' : 'Bookmark lesson'}>{mod?.bookmarked ? <BookmarkCheck className="w-5 h-5 text-gold" /> : <Bookmark className="w-5 h-5 text-muted" />}</button>
      </div>
      <Card><SectionTitle>Explanation</SectionTitle><p className="leading-relaxed">{l.explanation}</p>
        <div className="flex gap-2 mt-4"><Button size="sm" variant="outline" onClick={() => ask('simpler')} loading={exBusy}><Sparkles className="w-4 h-4" />Explain simpler</Button><Button size="sm" variant="outline" onClick={() => ask('deeper')} disabled={exBusy}>Go deeper</Button></div>
        {explain && <div className="mt-4 p-4 rounded-xl bg-raised/60 text-sm"><Markdown text={explain.text} /></div>}
      </Card>
      <Card><SectionTitle>Example</SectionTitle><p className="leading-relaxed">{l.example}</p></Card>
      <Card><SectionTitle>Practical exercise</SectionTitle><p className="leading-relaxed">{l.exercise}</p>
        <Field label="Your work / notes (saved automatically)"><textarea rows={5} defaultValue={mod?.notes || ''} key={mod?.id || 'new'} onBlur={(e) => e.target.value !== (mod?.notes || '') && saveMod({ notes: e.target.value })} /></Field></Card>
      <Card><SectionTitle>Quiz</SectionTitle><Quiz quiz={l.quiz} onFinish={(score) => { store.save('quiz_results', { quiz_id: l.id, subject_id: l.subjectId, score, total: l.quiz.length }); logActivity('quiz', 2, l.id); }} /></Card>
      <Card><SectionTitle>Flashcards</SectionTitle>
        <div className="grid sm:grid-cols-2 gap-2">{l.cards.map(([f, b]) => <FlipCard key={f} front={f} back={b} />)}</div>
        <Button size="sm" variant="outline" className="mt-3" onClick={async () => { const n = await addCards(l.subjectName, l.cards, `lesson:${l.id}`); setCardsMsg(n ? `Added ${n} cards to spaced repetition.` : 'Already in your deck.'); }}><Plus className="w-4 h-4" />Add to spaced repetition</Button>
        {cardsMsg && <p className="text-xs text-gold mt-2">{cardsMsg}</p>}
      </Card>
      <div className="flex flex-wrap gap-2 justify-between items-center">
        {completed ? <Badge tone="good"><Check className="w-3 h-3" />Completed</Badge> : <Button onClick={complete}><Check className="w-4 h-4" />Mark lesson complete</Button>}
        {next ? <Button variant="outline" onClick={() => nav(`/academy/lesson/${next.id}`)}>Next: {next.title}<ChevronRight className="w-4 h-4" /></Button> : <Button variant="outline" onClick={() => nav('/academy/connect?focus=' + l.subjectId)}>Connect the Knowledge<ChevronRight className="w-4 h-4" /></Button>}
      </div>
    </div>
  );
}

function FlipCard({ front, back }: { front: string; back: string }) {
  const [f, setF] = useState(false);
  return <button onClick={() => setF(!f)} className="p-4 rounded-xl bg-raised/60 hover:bg-raised text-left min-h-[80px]"><div className="text-[10px] uppercase tracking-wider text-muted">{f ? 'Answer' : 'Prompt'}</div><div className={cx('mt-1', f ? 'text-gold' : '')}>{f ? back : front}</div></button>;
}

function Revision({ lessons, subjectId, onExit }: { lessons: Lesson[]; subjectId: string; onExit: () => void }) {
  const qs = useMemo(() => lessons.flatMap((l) => l.quiz).sort(() => Math.random() - 0.5), [lessons]);
  return (
    <Card className="max-w-2xl">
      <SectionTitle action={<Button size="sm" variant="ghost" onClick={onExit}>Exit</Button>}>Revision session</SectionTitle>
      <Quiz quiz={qs} onFinish={(score) => { store.save('quiz_results', { quiz_id: `revision:${subjectId}`, subject_id: subjectId, score, total: qs.length }); logActivity('quiz', 5, `revision:${subjectId}`); }} />
    </Card>
  );
}

function Tutor() {
  const [msgs, setMsgs] = useState<(AIMsg & { demo?: boolean })[]>([]);
  const [q, setQ] = useState(''); const [level, setLevel] = useState('Beginner'); const [busy, setBusy] = useState(false);
  const send = async (text = q) => {
    if (!text.trim()) return;
    const next = [...msgs, { role: 'user' as const, content: text.trim() }];
    setMsgs(next); setQ(''); setBusy(true);
    const r = await askAI('tutor', next.map(({ role, content }) => ({ role, content })), { level });
    setMsgs([...next, { role: 'assistant', content: r.text, demo: r.demo }]); setBusy(false);
  };
  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
      <Card className="flex flex-col min-h-[60vh]">
        <div className="flex-1 space-y-4 overflow-y-auto">
          {!msgs.length && <div className="text-center py-10 text-muted"><GraduationCap className="w-8 h-8 mx-auto text-gold mb-3" />Ask about any concept. The tutor starts simple and increases complexity as you go.</div>}
          {msgs.map((m, i) => <div key={i} className={cx('max-w-[90%] rounded-2xl px-4 py-3 text-sm', m.role === 'user' ? 'ml-auto bg-gold/15' : 'bg-raised/60')}>{m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}</div>)}
          {busy && <Spinner label="Thinking" />}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 mt-4"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. What is entropy?" aria-label="Question" /><Button disabled={busy || !q.trim()} aria-label="Send"><Send className="w-4 h-4" /></Button></form>
      </Card>
      <div className="space-y-3">
        <Card><Field label="Explanation level"><select value={level} onChange={(e) => setLevel(e.target.value)}>{['Beginner', 'Intermediate', 'Advanced', 'Explain like I am 10'].map((x) => <option key={x}>{x}</option>)}</select></Field></Card>
        <Card><div className="text-sm mb-2">Try asking</div>{['What is compound interest?', 'Explain superposition simply', 'How do neural networks learn?', 'What is opportunity cost?', 'Why does entropy increase?'].map((s) => <button key={s} onClick={() => send(s)} className="block text-left text-sm text-muted hover:text-gold py-1">{s}</button>)}
          {msgs.length > 0 && <Button size="sm" variant="ghost" className="mt-2" onClick={() => send('Now explain that at a more advanced level.')}>Increase complexity ↑</Button>}</Card>
      </div>
    </div>
  );
}

function Connect() {
  const [params] = useSearchParams();
  const [sel, setSel] = useState<string | null>(params.get('focus'));
  const done = useCompleted();
  const progress = Object.fromEntries(SUBJECTS.map((s) => [s.id, (s.lessons.filter((l) => done.has(l.id)).length / s.lessons.length) * 100]));
  const links = sel ? LINKS.filter((l) => l.a === sel || l.b === sel) : [];
  const sub = sel ? getSubject(sel) : null;
  return (
    <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
      <Card className="p-2 md:p-4"><KnowledgeGraph selected={sel} onSelect={setSel} progress={progress} /><p className="text-xs text-muted text-center pb-2">Select a subject to see how it connects. Gold rings show your progress.</p></Card>
      <div className="space-y-3">
        {sub ? (
          <>
            <Card><div className="flex items-center gap-3"><SubjectIcon name={sub.icon} className="w-6 h-6 text-gold" /><h3 className="text-2xl">{sub.name}</h3></div><Link to={`/academy/subject/${sub.id}`} className="text-sm text-gold mt-2 inline-block">Open department →</Link></Card>
            {links.map((l) => { const other = getSubject(l.a === sel ? l.b : l.a)!; return (
              <Card key={other.id} className="p-4"><button onClick={() => setSel(other.id)} className="font-medium text-gold">{sub.name} ↔ {other.name}</button><p className="text-sm mt-1">{l.how}</p><p className="text-xs text-muted mt-2">Example: {l.example}</p></Card>); })}
          </>
        ) : (
          <Card>
            <SectionTitle>Cross-cutting concepts</SectionTitle>
            <p className="text-sm text-muted mb-3">Big ideas that appear in many fields. Mastering one accelerates learning in all of them.</p>
            <div className="space-y-3">{CONCEPTS.map((c) => <div key={c.id}><div className="text-sm font-medium">{c.label}</div><div className="flex flex-wrap gap-1 mt-1">{c.subjects.map((s) => <button key={s} onClick={() => setSel(s)} className="text-xs px-2 py-0.5 rounded-full bg-raised text-muted hover:text-gold">{getSubject(s)?.name}</button>)}</div></div>)}</div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Library() {
  const modules = useTable('learning_modules'); const lp = useTable('learning_progress'); const resources = useTable('saved_resources');
  const bms = modules.rows.filter((m) => m.bookmarked); const notes = modules.rows.filter((m) => m.notes.trim());
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card><SectionTitle>Bookmarks</SectionTitle>{bms.length ? bms.map((m) => { const l = getLesson(m.lesson_id); return l && <Link key={m.id} to={`/academy/lesson/${l.id}`} className="block py-2 text-sm hover:text-gold">{l.title} <span className="text-muted">· {l.subjectName}</span></Link>; }) : <p className="text-sm text-muted">Bookmark lessons to find them here.</p>}</Card>
      <Card><SectionTitle>Completed ({lp.rows.length}/{ALL_LESSONS.length})</SectionTitle>{lp.rows.length ? [...lp.rows].reverse().slice(0, 12).map((r) => { const l = getLesson(r.lesson_id); return l && <Link key={r.id} to={`/academy/lesson/${l.id}`} className="block py-1.5 text-sm hover:text-gold">{l.title} <span className="text-muted">· {l.subjectName}</span></Link>; }) : <p className="text-sm text-muted">Completed lessons appear here.</p>}</Card>
      <Card className="md:col-span-2"><SectionTitle>Notes</SectionTitle>{notes.length ? notes.map((m) => { const l = getLesson(m.lesson_id); return l && <div key={m.id} className="py-2 border-b border-line last:border-0"><Link to={`/academy/lesson/${l.id}`} className="text-sm text-gold">{l.title}</Link><p className="text-sm text-muted whitespace-pre-line mt-1">{m.notes}</p></div>; }) : <p className="text-sm text-muted">Your exercise notes from lessons collect here.</p>}</Card>
      <Card className="md:col-span-2"><SectionTitle>Saved resources</SectionTitle>{resources.rows.length ? resources.rows.map((x) => <a key={x.id} href={x.url} target="_blank" rel="noopener noreferrer" className="block py-1.5 text-sm text-gold hover:underline">{x.title} <span className="text-muted">· {getSubject(x.subject_id)?.name}</span></a>) : <p className="text-sm text-muted">Add trusted external resources from any department page.</p>}</Card>
    </div>
  );
}
