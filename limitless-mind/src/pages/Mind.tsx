import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { Brain, Check, ChevronRight, Lightbulb, Pause, Play, Plus, RotateCcw, Target, Timer, Trash2, Eye, Flame } from 'lucide-react';
import { Badge, Button, Card, Empty, Field, Notice, PageHeader, Progress, SectionTitle } from '../components/ui';
import { useTable } from '../lib/hooks';
import { logActivity } from '../lib/prefs';
import { chime } from '../lib/ambient';
import { addDays, cx, streak, today } from '../lib/util';
import { ATTENTION_EXERCISES, BIASES, CREATIVE, DECISIONS, DISCIPLINE_CHALLENGES, LOGIC } from '../content/mind';
import { preview, review, addCards } from '../lib/srs';
import { store } from '../lib/store';
import { SUBJECTS } from '../content/academy';

const MODULES = [
  { to: 'focus', label: 'Focus', icon: Timer, desc: 'Deep work timers, attention exercises and distraction management.' },
  { to: 'memory', label: 'Memory', icon: Brain, desc: 'Spaced-repetition flashcards, active recall and memory challenges.' },
  { to: 'thinking', label: 'Critical Thinking', icon: Target, desc: 'Logic puzzles, cognitive biases and decision scenarios.' },
  { to: 'creative', label: 'Creative Intelligence', icon: Lightbulb, desc: 'Idea generation, lateral thinking and pattern recognition.' },
  { to: 'discipline', label: 'Discipline', icon: Flame, desc: 'Habits, daily commitments, challenges and procrastination reflection.' },
];

export default function Mind() {
  return (
    <div>
      <PageHeader eyebrow="Mind Training" title="Train attention, memory and judgement." subtitle="Practical exercises. Small daily reps compound." />
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-line mb-6">
        <NavLink end to="/mind" className={({ isActive }) => cx('px-3.5 py-2.5 text-sm border-b-2 -mb-px whitespace-nowrap', isActive ? 'border-gold' : 'border-transparent text-muted')}>Overview</NavLink>
        {MODULES.map((m) => <NavLink key={m.to} to={`/mind/${m.to}`} className={({ isActive }) => cx('px-3.5 py-2.5 text-sm border-b-2 -mb-px whitespace-nowrap', isActive ? 'border-gold' : 'border-transparent text-muted')}>{m.label}</NavLink>)}
      </div>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="focus" element={<Focus />} />
        <Route path="memory" element={<Memory />} />
        <Route path="thinking" element={<Thinking />} />
        <Route path="creative" element={<Creative />} />
        <Route path="discipline" element={<Discipline />} />
      </Routes>
    </div>
  );
}

function Overview() {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{MODULES.map((m) => (
    <Link key={m.to} to={`/mind/${m.to}`} className="card p-5 hover:border-gold/50 transition group">
      <m.icon className="w-6 h-6 text-gold" /><h3 className="text-2xl mt-3 group-hover:text-gold">{m.label}</h3><p className="text-sm text-muted mt-1">{m.desc}</p>
      <div className="text-sm text-gold mt-4 flex items-center gap-1">Train <ChevronRight className="w-4 h-4" /></div>
    </Link>))}</div>;
}

/* ---------------- FOCUS ---------------- */
function Focus() {
  const presets = [{ w: 25, b: 5, l: 'Pomodoro' }, { w: 50, b: 10, l: 'Deep work' }, { w: 90, b: 15, l: 'Flow block' }];
  const [work, setWork] = useState(25); const [brk, setBrk] = useState(5);
  const [phase, setPhase] = useState<'idle' | 'work' | 'break'>('idle');
  const [left, setLeft] = useState(25 * 60); const [running, setRunning] = useState(false);
  const [task, setTask] = useState(''); const [distractions, setDistractions] = useState(0);
  const [done, setDone] = useState<string | null>(null);
  const activity = useTable('activity_log');
  const endAt = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => {
      const s = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        chime(); setRunning(false);
        if (phase === 'work') {
          logActivity('focus', work, task.slice(0, 80));
          setDone(`Focus session complete: ${work} minutes${task ? ` on “${task}”` : ''}. ${distractions} distraction${distractions === 1 ? '' : 's'} noted.`);
          setPhase('break'); setLeft(brk * 60);
          try { if (Notification.permission === 'granted') new Notification('Focus session complete', { body: 'Time for a break.' }); } catch { /* */ }
        } else { setPhase('idle'); setLeft(work * 60); }
      }
    }, 250);
    return () => clearInterval(i);
  }, [running, phase, work, brk, task, distractions]);

  const start = () => { if (phase === 'idle') { setPhase('work'); setDistractions(0); setDone(null); } endAt.current = Date.now() + left * 1000; setRunning(true); };
  const reset = () => { setRunning(false); setPhase('idle'); setLeft(work * 60); };
  const pick = (w: number, b: number) => { if (running) return; setWork(w); setBrk(b); setPhase('idle'); setLeft(w * 60); };
  const total = (phase === 'break' ? brk : work) * 60;
  const t = today();
  const todayMin = activity.rows.filter((a) => a.kind === 'focus' && a.occurred_on === t).reduce((n, a) => n + a.minutes, 0);

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
      <Card className="flex flex-col items-center py-8">
        <div className="flex gap-2 mb-6 flex-wrap justify-center">{presets.map((p) => <button key={p.l} onClick={() => pick(p.w, p.b)} className={cx('px-3 py-1.5 rounded-full text-xs border', work === p.w ? 'border-gold text-gold bg-gold/10' : 'border-line text-muted')}>{p.l} {p.w}/{p.b}</button>)}
          <label className="flex items-center gap-1 text-xs text-muted">Custom <input type="number" min={5} max={180} value={work} onChange={(e) => pick(Math.max(1, +e.target.value || 25), brk)} className="!w-16 !py-1" aria-label="Custom minutes" /></label></div>
        <div className="relative w-56 h-56">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90"><circle cx="50" cy="50" r="45" stroke="rgb(var(--line))" strokeWidth="3" fill="none" /><circle cx="50" cy="50" r="45" stroke="rgb(var(--gold))" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray={283} strokeDashoffset={283 * (left / total)} className="transition-all" /></svg>
          <div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-5xl font-display tabular-nums">{String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}</div><div className="text-xs uppercase tracking-widest text-muted mt-1">{phase === 'break' ? 'Break' : phase === 'work' ? 'Focus' : 'Ready'}</div></div></div>
        </div>
        <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="What is the one task for this block?" className="mt-6 max-w-sm text-center" maxLength={80} />
        <div className="flex gap-2 mt-4">
          {running ? <Button variant="outline" onClick={() => setRunning(false)}><Pause className="w-4 h-4" />Pause</Button> : <Button onClick={start}><Play className="w-4 h-4" />{phase === 'idle' ? 'Start focus' : 'Resume'}</Button>}
          <Button variant="ghost" onClick={reset}><RotateCcw className="w-4 h-4" />Reset</Button>
        </div>
        {phase === 'work' && <button onClick={() => setDistractions(distractions + 1)} className="mt-4 text-sm text-muted hover:text-gold">I got distracted (+1) · {distractions}</button>}
        {done && <div className="mt-5"><Notice>{done}</Notice></div>}
        <div className="text-xs text-muted mt-5">Focus logged today: {todayMin} min</div>
        {'Notification' in window && Notification.permission === 'default' && <button className="text-xs text-gold mt-2" onClick={() => Notification.requestPermission()}>Allow a notification when a session ends</button>}
      </Card>
      <div className="space-y-3">
        <SectionTitle>Attention exercises</SectionTitle>
        {ATTENTION_EXERCISES.map((x) => <AttentionExercise key={x.id} x={x} />)}
      </div>
    </div>
  );
}
function AttentionExercise({ x }: { x: typeof ATTENTION_EXERCISES[number] }) {
  const [open, setOpen] = useState(false); const [left, setLeft] = useState(x.minutes * 60); const [run, setRun] = useState(false);
  useEffect(() => { if (!run) return; const i = setInterval(() => setLeft((s) => { if (s <= 1) { setRun(false); chime(); logActivity('attention', x.minutes, x.id); return 0; } return s - 1; }), 1000); return () => clearInterval(i); }, [run, x]);
  return (
    <Card className="p-4">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center text-left"><span className="font-medium">{x.title}</span><span className="text-xs text-muted">{x.minutes} min</span></button>
      {open && <div className="mt-3 space-y-3"><ol className="list-decimal ml-5 text-sm text-muted space-y-1">{x.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <div className="flex items-center gap-3"><Button size="sm" onClick={() => { if (left === 0) setLeft(x.minutes * 60); setRun(!run); }}>{run ? 'Pause' : left === 0 ? 'Again' : 'Start timer'}</Button><span className="tabular-nums text-sm">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>{left === 0 && <Badge tone="good">Done</Badge>}</div></div>}
    </Card>
  );
}

/* ---------------- MEMORY ---------------- */
function Memory() {
  const cards = useTable('flashcards');
  const activity = useTable('activity_log');
  const [deck, setDeck] = useState('All');
  const [reviewing, setReviewing] = useState(false);
  const [front, setFront] = useState(''); const [back, setBack] = useState(''); const [newDeck, setNewDeck] = useState('Personal');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const now = new Date().toISOString();
  const decks = Array.from(new Set(cards.rows.map((c) => c.deck)));
  const inDeck = cards.rows.filter((c) => deck === 'All' || c.deck === deck);
  const due = inDeck.filter((c) => c.due <= now);
  const reviews = activity.rows.filter((a) => a.kind.startsWith('review_'));
  const retention = reviews.length ? Math.round((reviews.filter((a) => a.kind === 'review_pass').length / reviews.length) * 100) : null;

  const add = async () => { if (!front.trim() || !back.trim()) return; await addCards(newDeck.trim() || 'Personal', [[front.trim(), back.trim()]], 'manual'); setFront(''); setBack(''); };
  const importSubject = async (id: string) => {
    const s = SUBJECTS.find((x) => x.id === id); if (!s) return;
    const n = await addCards(s.name, s.lessons.flatMap((l) => l.cards), `subject:${id}`);
    setImportMsg(n ? `Added ${n} cards from ${s.name}.` : `${s.name} cards are already in your collection.`);
  };

  if (reviewing) return <Review cards={due} onDone={() => setReviewing(false)} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4"><div className="text-xs text-muted">Due now</div><div className="text-3xl font-display">{due.length}</div></div>
        <div className="card p-4"><div className="text-xs text-muted">Total cards</div><div className="text-3xl font-display">{cards.rows.length}</div></div>
        <div className="card p-4"><div className="text-xs text-muted">Recall rate</div><div className="text-3xl font-display">{retention == null ? '—' : `${retention}%`}</div></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <SectionTitle>Review</SectionTitle>
          <div className="flex gap-2"><select value={deck} onChange={(e) => setDeck(e.target.value)} aria-label="Deck"><option>All</option>{decks.map((d) => <option key={d}>{d}</option>)}</select>
            <Button onClick={() => setReviewing(true)} disabled={!due.length}>Review {due.length} due</Button></div>
          <p className="text-sm text-muted">Cards are scheduled with FSRS, a modern spaced-repetition algorithm: each review is timed for just before you are likely to forget. Try to recall the answer before revealing it.</p>
          {!cards.rows.length && <Notice tone="muted">No cards yet. Add your own or import a subject deck.</Notice>}
          <div className="pt-3 border-t border-line">
            <div className="text-sm mb-2">Import from the Academy</div>
            <select onChange={(e) => { if (e.target.value) importSubject(e.target.value); e.target.value = ''; }} defaultValue="" aria-label="Import subject"><option value="">Choose a subject…</option>{SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            {importMsg && <p className="text-xs text-gold mt-2">{importMsg}</p>}
          </div>
        </Card>
        <Card className="space-y-3">
          <SectionTitle>Create a card</SectionTitle>
          <Field label="Front (question or cue)"><input value={front} onChange={(e) => setFront(e.target.value)} maxLength={200} /></Field>
          <Field label="Back (answer)"><textarea rows={2} value={back} onChange={(e) => setBack(e.target.value)} maxLength={500} /></Field>
          <div className="flex gap-2"><input value={newDeck} onChange={(e) => setNewDeck(e.target.value)} placeholder="Deck" aria-label="Deck name" list="decks" /><datalist id="decks">{decks.map((d) => <option key={d} value={d} />)}</datalist><Button onClick={add} disabled={!front.trim() || !back.trim()}><Plus className="w-4 h-4" />Add</Button></div>
        </Card>
      </div>
      <SpanChallenge />
      {inDeck.length > 0 && <Card><SectionTitle>Cards {deck !== 'All' && `· ${deck}`}</SectionTitle><div className="divide-y divide-line max-h-80 overflow-auto">{inDeck.map((c) => (
        <div key={c.id} className="py-2 flex items-center gap-3 text-sm"><div className="flex-1 min-w-0"><div className="truncate">{c.front}</div><div className="text-xs text-muted truncate">{c.back}</div></div><span className="text-xs text-muted whitespace-nowrap">{c.due <= now ? 'due' : new Date(c.due).toLocaleDateString()}</span><button onClick={() => cards.remove(c.id)} className="text-muted hover:text-bad" aria-label="Delete card"><Trash2 className="w-4 h-4" /></button></div>))}</div></Card>}
    </div>
  );
}
function Review({ cards, onDone }: { cards: import('../lib/types').Flashcard[]; onDone: () => void }) {
  const [queue] = useState(() => [...cards].sort(() => Math.random() - 0.5));
  const [i, setI] = useState(0); const [show, setShow] = useState(false);
  const c = queue[i];
  if (!c) return <Card className="text-center py-12"><Check className="w-8 h-8 text-good mx-auto" /><h3 className="text-2xl mt-3">Review complete</h3><p className="text-muted text-sm">{queue.length} cards reviewed.</p><Button className="mt-4" onClick={onDone}>Back</Button></Card>;
  const opts = preview(c);
  return (
    <div className="max-w-xl mx-auto space-y-3">
      <div className="flex justify-between text-sm text-muted"><span>{c.deck}</span><span>{i + 1} / {queue.length}</span></div>
      <Progress value={(i / queue.length) * 100} />
      <Card className="min-h-[240px] flex flex-col justify-center text-center">
        <div className="font-display text-2xl">{c.front}</div>
        {show && <div className="mt-6 pt-6 border-t border-line text-lg fade-in">{c.back}</div>}
      </Card>
      {show ? <div className="grid grid-cols-4 gap-2">{opts.map((o) => <Button key={o.g} variant={o.label === 'Again' ? 'danger' : o.label === 'Good' ? 'gold' : 'outline'} onClick={async () => { await review(c, o.g); setShow(false); setI(i + 1); }} className="flex-col !gap-0"><span>{o.label}</span><span className="text-[10px] opacity-70">{o.interval}</span></Button>)}</div>
        : <Button className="w-full" size="lg" onClick={() => setShow(true)}><Eye className="w-4 h-4" />Reveal answer</Button>}
      <button className="text-sm text-muted w-full" onClick={onDone}>End review</button>
    </div>
  );
}
function SpanChallenge() {
  const [len, setLen] = useState(5); const [seq, setSeq] = useState(''); const [phase, setPhase] = useState<'idle' | 'show' | 'recall' | 'result'>('idle');
  const [ans, setAns] = useState(''); const [best, setBest] = useState(0);
  const go = () => { setSeq(Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('')); setAns(''); setPhase('show'); setTimeout(() => setPhase('recall'), 900 * len); };
  const check = () => { const ok = ans.replace(/\D/g, '') === seq; if (ok) { setBest(Math.max(best, len)); setLen(len + 1); } else setLen(Math.max(3, len - 1)); setPhase('result'); store.save('quiz_results', { quiz_id: 'digit-span', subject_id: 'mind', score: ok ? 1 : 0, total: 1 }); };
  const ok = ans.replace(/\D/g, '') === seq;
  return (
    <Card>
      <SectionTitle>Memory challenge: digit span</SectionTitle>
      <p className="text-sm text-muted mb-3">Memorise the digits, then type them back. Chunking (e.g. 482-91-7) helps. Typical adult span is around 7.</p>
      {phase === 'idle' && <Button onClick={go}>Start with {len} digits</Button>}
      {phase === 'show' && <div className="text-4xl font-display tracking-[0.4em] text-gold py-4">{seq}</div>}
      {phase === 'recall' && <form onSubmit={(e) => { e.preventDefault(); check(); }} className="flex gap-2"><input autoFocus inputMode="numeric" value={ans} onChange={(e) => setAns(e.target.value)} placeholder="Type the digits" aria-label="Digits" /><Button>Check</Button></form>}
      {phase === 'result' && <div className="space-y-3"><Notice tone={ok ? 'gold' : 'bad'}>{ok ? `Correct! Next: ${len} digits.` : `It was ${seq}. Next: ${len} digits.`}</Notice><Button onClick={go}>Next round</Button></div>}
      {best > 0 && <div className="text-xs text-muted mt-3">Best this session: {best} digits</div>}
    </Card>
  );
}

/* ---------------- THINKING ---------------- */
function Thinking() {
  const [i, setI] = useState(0); const [picked, setPicked] = useState<number | null>(null); const [score, setScore] = useState(0);
  const q = LOGIC[i % LOGIC.length];
  const answer = (k: number) => { if (picked != null) return; setPicked(k); if (k === q.answer) setScore(score + 1); if ((i + 1) % LOGIC.length === 0) store.save('quiz_results', { quiz_id: 'logic-set', subject_id: 'mind', score: score + (k === q.answer ? 1 : 0), total: LOGIC.length }); };
  const [dec, setDec] = useState(0); const [notes, setNotes] = useState<Record<number, string>>({}); const [saved, setSaved] = useState(false);
  const d = DECISIONS[dec];
  const saveDecision = async () => {
    await store.save('journal_entries', { kind: 'reflection', title: `Decision practice: ${d.title}`, body: d.scenario, answers: Object.fromEntries(d.prompts.map((p, k) => [p, notes[k] || ''])), tags: ['decision', 'critical-thinking'], mood: null, is_private: false, entry_date: today() });
    logActivity('thinking', 10, d.id); setSaved(true);
  };
  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle action={<span className="text-xs text-muted">Score {score} · {i % LOGIC.length + 1}/{LOGIC.length}</span>}>Reasoning challenge</SectionTitle>
          <Badge>{q.kind}</Badge>
          <p className="mt-3 font-medium">{q.q}</p>
          <div className="space-y-2 mt-4">{q.options.map((o, k) => (
            <button key={k} onClick={() => answer(k)} className={cx('w-full text-left px-4 py-3 rounded-xl border text-sm transition', picked == null ? 'border-line hover:border-gold/50' : k === q.answer ? 'border-good bg-good/10' : k === picked ? 'border-bad bg-bad/10' : 'border-line opacity-60')}>{o}</button>))}</div>
          {picked != null && <div className="mt-4 space-y-3 fade-in"><Notice tone={picked === q.answer ? 'gold' : 'bad'}>{picked === q.answer ? 'Correct. ' : 'Not quite. '}{q.why}</Notice><Button size="sm" onClick={() => { setPicked(null); setI(i + 1); if ((i + 1) % LOGIC.length === 0) setScore(0); }}>Next puzzle</Button></div>}
        </Card>
        <Card>
          <SectionTitle>Decision scenario</SectionTitle>
          <div className="flex gap-1 mb-3 flex-wrap">{DECISIONS.map((x, k) => <button key={x.id} onClick={() => { setDec(k); setNotes({}); setSaved(false); }} className={cx('px-2.5 py-1 rounded-full text-xs border', k === dec ? 'border-gold text-gold' : 'border-line text-muted')}>{x.title}</button>)}</div>
          <p className="text-sm">{d.scenario}</p>
          <div className="space-y-3 mt-4">{d.prompts.map((p, k) => <Field key={p} label={p}><textarea rows={2} value={notes[k] || ''} onChange={(e) => setNotes({ ...notes, [k]: e.target.value })} /></Field>)}</div>
          <Button size="sm" className="mt-3" onClick={saveDecision} disabled={!Object.values(notes).some((v) => v.trim())}>{saved ? 'Saved to journal ✓' : 'Save analysis to journal'}</Button>
        </Card>
      </div>
      <Card>
        <SectionTitle>Cognitive bias field guide</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{BIASES.map((b) => <BiasCard key={b.name} b={b} />)}</div>
      </Card>
    </div>
  );
}
function BiasCard({ b }: { b: typeof BIASES[number] }) {
  const [flip, setFlip] = useState(false);
  return <button onClick={() => setFlip(!flip)} className="text-left p-4 rounded-xl bg-raised/50 hover:bg-raised min-h-[130px] transition"><div className="font-medium text-gold">{b.name}</div><p className="text-sm text-muted mt-1">{flip ? <><span className="text-ink">Counter: </span>{b.counter}</> : b.what}</p><div className="text-[10px] text-muted mt-2 uppercase tracking-wider">{flip ? 'Tap for definition' : 'Tap for countermeasure'}</div></button>;
}

/* ---------------- CREATIVE ---------------- */
function Creative() {
  const [obj, setObj] = useState(() => CREATIVE.alternateUses[Math.floor(Math.random() * CREATIVE.alternateUses.length)]);
  const [ideas, setIdeas] = useState<string[]>([]); const [idea, setIdea] = useState(''); const [left, setLeft] = useState(0);
  useEffect(() => { if (left <= 0) return; const t = setTimeout(() => { setLeft(left - 1); if (left === 1) chime(); }, 1000); return () => clearTimeout(t); }, [left]);
  const [saved, setSaved] = useState(false);
  const saveIdeas = async () => { await store.save('journal_entries', { kind: 'idea', title: `Alternate uses: ${obj}`, body: ideas.map((x) => `- ${x}`).join('\n'), answers: {}, tags: ['creativity'], mood: null, is_private: false, entry_date: today() }); logActivity('creative', 2, 'aut'); setSaved(true); };
  const [lat, setLat] = useState(0); const [showA, setShowA] = useState(false);
  const [pat, setPat] = useState(0); const [pAns, setPAns] = useState(''); const [pRes, setPRes] = useState<boolean | null>(null);
  const [scamper, setScamper] = useState<Record<string, string>>({}); const [scTopic, setScTopic] = useState('');
  const constraint = useMemo(() => CREATIVE.constraints[new Date().getDate() % CREATIVE.constraints.length], []);
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <SectionTitle>Idea sprint: alternate uses</SectionTitle>
        <p className="text-sm text-muted">List as many uses as you can for <span className="text-gold">{obj}</span> in 2 minutes. Quantity first; judge later.</p>
        <div className="flex gap-2 mt-3">{left > 0 ? <Badge tone="gold">{left}s</Badge> : <Button size="sm" onClick={() => { setIdeas([]); setSaved(false); setLeft(120); }}>Start 2-minute sprint</Button>}<Button size="sm" variant="ghost" onClick={() => setObj(CREATIVE.alternateUses[Math.floor(Math.random() * CREATIVE.alternateUses.length)])}>New object</Button></div>
        <form onSubmit={(e) => { e.preventDefault(); if (idea.trim()) { setIdeas([...ideas, idea.trim()]); setIdea(''); } }} className="flex gap-2 mt-3"><input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Type an idea and press Enter" aria-label="Idea" /><Button size="sm" variant="outline">Add</Button></form>
        <ol className="list-decimal ml-5 text-sm mt-3 space-y-0.5">{ideas.map((x, k) => <li key={k}>{x}</li>)}</ol>
        {ideas.length > 0 && left === 0 && <Button size="sm" className="mt-3" onClick={saveIdeas} disabled={saved}>{saved ? `Saved ${ideas.length} ideas ✓` : `Save ${ideas.length} ideas to journal`}</Button>}
      </Card>
      <Card>
        <SectionTitle>Lateral thinking</SectionTitle>
        <p className="font-medium">{CREATIVE.lateral[lat].q}</p>
        {showA ? <Notice>{CREATIVE.lateral[lat].a}</Notice> : <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowA(true)}>Reveal answer</Button>}
        <Button size="sm" variant="ghost" className="mt-3 ml-2" onClick={() => { setLat((lat + 1) % CREATIVE.lateral.length); setShowA(false); }}>Next</Button>
        <div className="mt-6 pt-4 border-t border-line">
          <div className="text-sm mb-2">Pattern recognition: what comes next?</div>
          <div className="font-display text-2xl text-gold">{CREATIVE.patterns[pat].seq}</div>
          <form className="flex gap-2 mt-2" onSubmit={(e) => { e.preventDefault(); setPRes(pAns.trim().toUpperCase() === CREATIVE.patterns[pat].a.toUpperCase()); }}><input value={pAns} onChange={(e) => setPAns(e.target.value)} aria-label="Answer" /><Button size="sm">Check</Button></form>
          {pRes != null && <div className="mt-2 text-sm">{pRes ? '✓ Correct. ' : `✗ Answer: ${CREATIVE.patterns[pat].a}. `}<span className="text-muted">{CREATIVE.patterns[pat].why}</span> <button className="text-gold ml-1" onClick={() => { setPat((pat + 1) % CREATIVE.patterns.length); setPAns(''); setPRes(null); }}>Next →</button></div>}
        </div>
      </Card>
      <Card>
        <SectionTitle>Today’s creative constraint</SectionTitle>
        <p className="font-display text-xl">{constraint}</p>
        <p className="text-sm text-muted mt-2">Constraints force novel solutions. Spend 10 minutes, then capture what you made in your journal.</p>
      </Card>
      <Card>
        <SectionTitle>Innovation: SCAMPER</SectionTitle>
        <input value={scTopic} onChange={(e) => setScTopic(e.target.value)} placeholder="Product, process or idea to improve" aria-label="Topic" />
        <div className="space-y-2 mt-3">{CREATIVE.scamper.map((s) => <Field key={s} label={s}><input value={scamper[s] || ''} onChange={(e) => setScamper({ ...scamper, [s]: e.target.value })} /></Field>)}</div>
        <Button size="sm" className="mt-3" disabled={!scTopic.trim()} onClick={async () => { await store.save('journal_entries', { kind: 'idea', title: `SCAMPER: ${scTopic}`, body: '', answers: scamper, tags: ['innovation'], mood: null, is_private: false, entry_date: today() }); logActivity('creative', 10, 'scamper'); setScamper({}); setScTopic(''); }}>Save to journal</Button>
      </Card>
    </div>
  );
}

/* ---------------- DISCIPLINE ---------------- */
function Discipline() {
  const habits = useTable('habits'); const tasks = useTable('tasks');
  const [title, setTitle] = useState(''); const [commit, setCommit] = useState('');
  const t = today();
  const week = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const toggle = (h: import('../lib/types').Habit, d: string) => { const log = h.log.includes(d) ? h.log.filter((x) => x !== d) : [...h.log, d]; habits.save({ id: h.id, log }); if (!h.log.includes(d)) logActivity('habit', 0, h.id); };
  const commitments = tasks.rows.filter((x) => x.kind === 'commitment' && x.due === t);
  const [proc, setProc] = useState({ task: '', feeling: '', step: '' }); const [procSaved, setProcSaved] = useState(false);
  const active = habits.rows.filter((h) => !h.archived);
  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
        <Card>
          <SectionTitle>Habit tracker</SectionTitle>
          <form className="flex gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); if (title.trim()) { habits.save({ title: title.trim(), category: 'General', log: [], archived: false }); setTitle(''); } }}><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New habit, e.g. Read 10 pages" maxLength={80} aria-label="New habit" /><Button><Plus className="w-4 h-4" /></Button></form>
          {active.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left font-normal text-muted pb-2">Habit</th>{week.map((d) => <th key={d} className="font-normal text-muted text-xs pb-2 w-9">{new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'narrow' })}</th>)}<th className="text-xs text-muted font-normal">Streak</th><th /></tr></thead>
            <tbody>{active.map((h) => <tr key={h.id} className="border-t border-line"><td className="py-2 pr-2">{h.title}</td>{week.map((d) => <td key={d} className="text-center"><button onClick={() => toggle(h, d)} className={cx('w-7 h-7 rounded-lg', h.log.includes(d) ? 'bg-gold text-black' : 'bg-raised')} aria-label={`${h.title} ${d}`}>{h.log.includes(d) && <Check className="w-4 h-4 mx-auto" />}</button></td>)}<td className="text-center text-gold">{streak(h.log)}</td><td><button onClick={() => confirm('Archive this habit?') && habits.save({ id: h.id, archived: true })} className="text-muted hover:text-bad p-1" aria-label="Archive"><Trash2 className="w-4 h-4" /></button></td></tr>)}</tbody></table></div>
            : <Empty title="No habits yet" text="Start with one tiny habit you can do even on a bad day." />}
          {active.length > 0 && <p className="text-xs text-muted mt-3">Consistency (last 7 days): {Math.round((active.reduce((n, h) => n + week.filter((d) => h.log.includes(d)).length, 0) / (active.length * 7)) * 100)}%</p>}
        </Card>
        <Card>
          <SectionTitle>Today’s commitments</SectionTitle>
          <form className="flex gap-2 mb-3" onSubmit={(e) => { e.preventDefault(); if (commit.trim()) { tasks.save({ title: commit.trim(), kind: 'commitment', due: t, done: false, done_at: null, goal_id: null, milestone_id: null, priority: 'medium' }); setCommit(''); } }}><input value={commit} onChange={(e) => setCommit(e.target.value)} placeholder="I will…" aria-label="Commitment" /><Button><Plus className="w-4 h-4" /></Button></form>
          {commitments.length ? commitments.map((c) => <label key={c.id} className="flex items-center gap-3 py-2"><input type="checkbox" checked={c.done} onChange={() => { tasks.save({ id: c.id, done: !c.done, done_at: !c.done ? new Date().toISOString() : null }); if (!c.done) logActivity('commitment', 0, c.id); }} /><span className={cx('text-sm', c.done && 'line-through text-muted')}>{c.title}</span></label>) : <p className="text-sm text-muted">Make one or two promises to yourself for today.</p>}
        </Card>
      </div>
      <Card>
        <SectionTitle>Behavioural challenges</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{DISCIPLINE_CHALLENGES.map((c) => {
          const h = habits.rows.find((x) => x.title === c.title && !x.archived);
          const doneDays = h ? h.log.length : 0;
          return <div key={c.id} className="p-4 rounded-xl bg-raised/50"><div className="flex justify-between"><span className="font-medium">{c.title}</span><Badge>{c.days} days</Badge></div><p className="text-sm text-muted mt-1">{c.desc}</p>
            {h ? <div className="mt-3"><Progress value={(doneDays / c.days) * 100} /><div className="text-xs text-muted mt-1">{doneDays}/{c.days} days · check in on the habit tracker</div></div> : <Button size="sm" variant="outline" className="mt-3" onClick={() => habits.save({ title: c.title, category: 'Challenge', log: [], archived: false })}>Start challenge</Button>}</div>;
        })}</div>
      </Card>
      <Card>
        <SectionTitle>Procrastination reflection</SectionTitle>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="What am I avoiding?"><input value={proc.task} onChange={(e) => setProc({ ...proc, task: e.target.value })} /></Field>
          <Field label="What feeling does it trigger?"><input value={proc.feeling} onChange={(e) => setProc({ ...proc, feeling: e.target.value })} placeholder="boredom, fear, confusion…" /></Field>
          <Field label="What is the two-minute first step?"><input value={proc.step} onChange={(e) => setProc({ ...proc, step: e.target.value })} /></Field>
        </div>
        <div className="flex gap-2 mt-3"><Button size="sm" disabled={!proc.task.trim()} onClick={async () => {
          await store.save('journal_entries', { kind: 'reflection', title: `Procrastination: ${proc.task}`, body: '', answers: { 'Avoiding': proc.task, 'Feeling': proc.feeling, 'First step': proc.step }, tags: ['procrastination'], mood: null, is_private: false, entry_date: t });
          if (proc.step.trim()) await store.save('tasks', { title: proc.step.trim(), kind: 'commitment', due: t, done: false, done_at: null, goal_id: null, milestone_id: null, priority: 'high' });
          setProc({ task: '', feeling: '', step: '' }); setProcSaved(true);
        }}>Save & add first step to today</Button>{procSaved && <span className="text-sm text-gold self-center">Saved ✓</span>}</div>
      </Card>
    </div>
  );
}
