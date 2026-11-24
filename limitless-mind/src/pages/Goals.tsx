import { useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, ChevronRight, Lightbulb, Plus, Sparkles, Target, Trash2, ArrowRight } from 'lucide-react';
import { Badge, Button, Card, Empty, Field, Modal, Notice, PageHeader, Progress, SectionTitle, Spinner } from '../components/ui';
import { useTable } from '../lib/hooks';
import { goalProgress, GOAL_CATEGORIES, HORIZONS, isOverdue, STAGES } from '../lib/goals';
import { cx, fmtDate, today } from '../lib/util';
import { logActivity } from '../lib/prefs';
import { askAI, extractJSON } from '../lib/ai';
import { store } from '../lib/store';
import type { Goal, GoalHorizon, GoalStage, Task } from '../lib/types';

export default function Goals() {
  return (
    <div>
      <PageHeader eyebrow="Goals & Execution" title="From intention to evidence." subtitle="Goals, milestones and tasks, plus Idea to Reality for turning ideas into projects." />
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-line mb-6">
        {[['/goals', 'Goals', true], ['/goals/execution', 'Execution dashboard', false], ['/goals/ideas', 'Idea to Reality', false]].map(([to, l, end]) => <NavLink key={to as string} end={end as boolean} to={to as string} className={({ isActive }) => cx('px-3.5 py-2.5 text-sm border-b-2 -mb-px whitespace-nowrap', isActive ? 'border-gold' : 'border-transparent text-muted')}>{l as string}</NavLink>)}
      </div>
      <Routes>
        <Route index element={<GoalList />} />
        <Route path="execution" element={<Execution />} />
        <Route path="ideas" element={<Ideas />} />
        <Route path=":id" element={<GoalDetail />} />
      </Routes>
    </div>
  );
}

function GoalForm({ initial, onSubmit, onCancel, project }: { initial?: Partial<Goal>; onSubmit: (g: Partial<Goal>) => Promise<void>; onCancel: () => void; project?: boolean }) {
  const [g, setG] = useState<Partial<Goal>>({ title: '', description: '', horizon: '30d', category: 'Personal', deadline: null, priority: 'medium', notes: '', ...initial });
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!g.title?.trim()) return setErr('A title is required.');
    if (g.deadline && g.deadline < today() && !initial?.id) return setErr('The deadline is in the past.');
    setBusy(true); await onSubmit({ ...g, title: g.title.trim() }); setBusy(false);
  };
  return (
    <div className="space-y-3">
      <Field label={project ? 'Idea' : 'Goal title'} error={err}><input value={g.title} onChange={(e) => setG({ ...g, title: e.target.value })} autoFocus maxLength={120} /></Field>
      <Field label="Description"><textarea rows={3} value={g.description} onChange={(e) => setG({ ...g, description: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Timeframe"><select value={g.horizon} onChange={(e) => setG({ ...g, horizon: e.target.value as GoalHorizon })}>{Object.entries(HORIZONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="Category"><select value={g.category} onChange={(e) => setG({ ...g, category: e.target.value })}>{GOAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Deadline"><input type="date" value={g.deadline || ''} onChange={(e) => setG({ ...g, deadline: e.target.value || null })} /></Field>
        <Field label="Priority"><select value={g.priority} onChange={(e) => setG({ ...g, priority: e.target.value as Goal['priority'] })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></Field>
      </div>
      <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button onClick={submit} loading={busy}>Save</Button></div>
    </div>
  );
}

function GoalList() {
  const goals = useTable('goals'); const ms = useTable('milestones'); const tasks = useTable('tasks');
  const [sp, setSp] = useSearchParams(); const nav = useNavigate();
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');
  const [cat, setCat] = useState('All');
  const list = goals.rows.filter((g) => !g.is_project && (filter === 'all' || g.status === (filter === 'active' ? 'active' : 'completed') || (filter === 'active' && g.status === 'paused')) && (cat === 'All' || g.category === cat));
  const open = sp.get('new') === '1';
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {(['active', 'completed', 'all'] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={cx('px-3 py-1.5 rounded-full text-xs border capitalize', filter === f ? 'border-gold text-gold bg-gold/10' : 'border-line text-muted')}>{f}</button>)}
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="!w-40 !py-1.5 text-sm" aria-label="Category"><option>All</option>{GOAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <div className="flex-1" /><Button onClick={() => setSp({ new: '1' })}><Plus className="w-4 h-4" />New goal</Button>
      </div>
      {goals.loading ? <Spinner /> : list.length ? (
        <div className="grid md:grid-cols-2 gap-3">{list.map((g) => {
          const pct = goalProgress(g, ms.rows, tasks.rows);
          const overdue = isOverdue(g.deadline, g.status === 'completed');
          return (
            <Link key={g.id} to={`/goals/${g.id}`} className="card p-5 hover:border-gold/40 transition">
              <div className="flex gap-2 flex-wrap"><Badge>{HORIZONS[g.horizon]}</Badge><Badge>{g.category}</Badge>{g.priority === 'high' && <Badge tone="gold">High priority</Badge>}{g.status === 'completed' && <Badge tone="good">Completed</Badge>}{overdue && <Badge tone="bad">Overdue</Badge>}</div>
              <h3 className="text-xl mt-3">{g.title}</h3>
              {g.description && <p className="text-sm text-muted mt-1 line-clamp-2">{g.description}</p>}
              <div className="flex justify-between text-xs text-muted mt-4 mb-1.5"><span>{g.deadline ? `Due ${fmtDate(g.deadline)}` : 'No deadline'}</span><span>{pct}%</span></div>
              <Progress value={pct} />
            </Link>
          );
        })}</div>
      ) : <Empty icon={<Target className="w-5 h-5" />} title="No goals here" text="A good goal is specific, has a deadline, and is broken into milestones." action={<Button size="sm" onClick={() => setSp({ new: '1' })}>Create a goal</Button>} />}
      <Modal open={open} onClose={() => setSp({})} title="New goal">
        <GoalForm initial={{ category: sp.get('category') || 'Personal' }} onCancel={() => setSp({})} onSubmit={async (g) => { const row = await goals.save({ ...g, status: 'active', is_project: false, stage: 'planning', notes: '' }); nav(`/goals/${row.id}`); }} />
      </Modal>
    </div>
  );
}

function GoalDetail() {
  const { id = '' } = useParams(); const nav = useNavigate();
  const goals = useTable('goals'); const ms = useTable('milestones'); const tasks = useTable('tasks');
  const g = goals.rows.find((x) => x.id === id);
  const [edit, setEdit] = useState(false); const [mTitle, setMTitle] = useState(''); const [mDue, setMDue] = useState('');
  const [tTitle, setTTitle] = useState(''); const [tDue, setTDue] = useState(''); const [tMs, setTMs] = useState('');
  const [ai, setAi] = useState<{ busy: boolean; msg: string | null }>({ busy: false, msg: null });
  if (goals.loading) return <Spinner />;
  if (!g) return <Empty title="Goal not found" />;
  const gm = ms.rows.filter((m) => m.goal_id === g.id).sort((a, b) => (a.due || '9').localeCompare(b.due || '9'));
  const gt = tasks.rows.filter((t) => t.goal_id === g.id);
  const pct = goalProgress(g, ms.rows, tasks.rows);
  const toggleTask = async (t: Task) => { await tasks.save({ id: t.id, done: !t.done, done_at: !t.done ? new Date().toISOString() : null }); if (!t.done) logActivity(g.category === 'Financial' || g.category === 'Business' ? 'business_action' : 'task', 0, t.id); };
  const complete = async () => { await goals.save({ id: g.id, status: g.status === 'completed' ? 'active' : 'completed', stage: g.status === 'completed' ? g.stage : 'completion' }); if (g.status !== 'completed') logActivity('goal_complete', 0, g.id); };
  const remove = async () => { if (!confirm('Delete this goal and its milestones and tasks?')) return; for (const m of gm) await ms.remove(m.id); for (const t of gt) await tasks.remove(t.id); await goals.remove(g.id); nav(g.is_project ? '/goals/ideas' : '/goals'); };
  const breakdown = async () => {
    setAi({ busy: true, msg: null });
    const r = await askAI('plan', [{ role: 'user', content: `Break this goal into realistic milestones and tasks: ${g.title}. ${g.description}. Deadline: ${g.deadline || 'none'}.` }], { idea: g.title });
    const parsed = extractJSON<{ steps: { stage?: string; title: string }[] }>(r.text);
    if (!parsed?.steps?.length) { setAi({ busy: false, msg: 'Could not read a plan from the response.' }); return; }
    for (const s of parsed.steps.slice(0, 12)) await tasks.save({ goal_id: g.id, milestone_id: null, title: s.title.slice(0, 160), due: null, done: false, done_at: null, kind: 'task', priority: 'medium' });
    setAi({ busy: false, msg: `${r.demo ? 'Demo mode (template steps): ' : ''}Added ${Math.min(12, parsed.steps.length)} suggested tasks. Edit or delete any that don’t fit.` });
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <Link to={g.is_project ? '/goals/ideas' : '/goals'} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="w-4 h-4" />{g.is_project ? 'Idea to Reality' : 'Goals'}</Link>
      {edit ? <Card><GoalForm initial={g} project={g.is_project} onCancel={() => setEdit(false)} onSubmit={async (p) => { await goals.save({ ...p, id: g.id }); setEdit(false); }} /></Card> : (
        <Card>
          <div className="flex gap-2 flex-wrap"><Badge>{HORIZONS[g.horizon]}</Badge><Badge>{g.category}</Badge><Badge tone={g.priority === 'high' ? 'gold' : 'muted'}>{g.priority} priority</Badge>{g.is_project && <Badge tone="gold">Stage: {g.stage}</Badge>}{g.status === 'completed' && <Badge tone="good">Completed</Badge>}</div>
          <h2 className="text-3xl mt-3">{g.title}</h2>
          {g.description && <p className="text-muted mt-2 whitespace-pre-line">{g.description}</p>}
          <div className="text-sm text-muted mt-3">{g.deadline ? `Deadline ${fmtDate(g.deadline)}` : 'No deadline'}{isOverdue(g.deadline, g.status === 'completed') && <span className="text-bad"> · overdue</span>}</div>
          <div className="mt-4"><div className="flex justify-between text-sm mb-1.5"><span>Progress</span><span>{pct}%</span></div><Progress value={pct} /></div>
          {g.is_project && <div className="flex gap-1 mt-4 overflow-x-auto no-scrollbar">{STAGES.map((s) => <button key={s} onClick={() => goals.save({ id: g.id, stage: s, status: s === 'completion' ? 'completed' : 'active' })} className={cx('px-2.5 py-1 rounded-full text-xs capitalize whitespace-nowrap border', g.stage === s ? 'border-gold bg-gold/10 text-gold' : STAGES.indexOf(s) < STAGES.indexOf(g.stage) ? 'border-line text-ink' : 'border-line text-muted')}>{s}</button>)}</div>}
          <div className="flex flex-wrap gap-2 mt-5"><Button size="sm" onClick={complete}><Check className="w-4 h-4" />{g.status === 'completed' ? 'Reopen' : 'Mark complete'}</Button><Button size="sm" variant="outline" onClick={() => setEdit(true)}>Edit</Button><Button size="sm" variant="outline" onClick={breakdown} loading={ai.busy}><Sparkles className="w-4 h-4" />Break into steps</Button><Button size="sm" variant="danger" onClick={remove}><Trash2 className="w-4 h-4" />Delete</Button></div>
          {ai.msg && <div className="mt-3"><Notice>{ai.msg}</Notice></div>}
        </Card>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle>Milestones</SectionTitle>
          <form className="flex gap-2 mb-3" onSubmit={(e) => { e.preventDefault(); if (mTitle.trim()) { ms.save({ goal_id: g.id, title: mTitle.trim(), due: mDue || null, done: false }); setMTitle(''); setMDue(''); } }}><input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="Milestone" aria-label="Milestone" /><input type="date" value={mDue} onChange={(e) => setMDue(e.target.value)} className="!w-40" aria-label="Milestone due" /><Button variant="outline" aria-label="Add milestone"><Plus className="w-4 h-4" /></Button></form>
          {gm.length ? gm.map((m) => <div key={m.id} className="flex items-center gap-3 py-2 border-t border-line first:border-0"><input type="checkbox" checked={m.done} onChange={() => { ms.save({ id: m.id, done: !m.done }); if (!m.done) logActivity('milestone', 0, m.id); }} aria-label={m.title} /><span className={cx('flex-1 text-sm', m.done && 'line-through text-muted')}>{m.title}</span>{m.due && <span className={cx('text-xs', isOverdue(m.due, m.done) ? 'text-bad' : 'text-muted')}>{fmtDate(m.due)}</span>}<button onClick={() => ms.remove(m.id)} className="text-muted hover:text-bad" aria-label="Delete milestone"><Trash2 className="w-3.5 h-3.5" /></button></div>) : <p className="text-sm text-muted">Add 3–5 verifiable checkpoints.</p>}
        </Card>
        <Card>
          <SectionTitle>Tasks</SectionTitle>
          <form className="space-y-2 mb-3" onSubmit={(e) => { e.preventDefault(); if (tTitle.trim()) { tasks.save({ goal_id: g.id, milestone_id: tMs || null, title: tTitle.trim(), due: tDue || null, done: false, done_at: null, kind: 'task', priority: 'medium' }); setTTitle(''); setTDue(''); } }}>
            <div className="flex gap-2"><input value={tTitle} onChange={(e) => setTTitle(e.target.value)} placeholder="Next action" aria-label="Task" /><Button variant="outline" aria-label="Add task"><Plus className="w-4 h-4" /></Button></div>
            <div className="flex gap-2"><input type="date" value={tDue} onChange={(e) => setTDue(e.target.value)} aria-label="Task due" />{gm.length > 0 && <select value={tMs} onChange={(e) => setTMs(e.target.value)} aria-label="Milestone"><option value="">No milestone</option>{gm.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select>}</div>
          </form>
          {gt.length ? [...gt].sort((a, b) => Number(a.done) - Number(b.done)).map((t) => <div key={t.id} className="flex items-center gap-3 py-2 border-t border-line first:border-0"><input type="checkbox" checked={t.done} onChange={() => toggleTask(t)} aria-label={t.title} /><div className="flex-1 min-w-0"><div className={cx('text-sm', t.done && 'line-through text-muted')}>{t.title}</div>{t.milestone_id && <div className="text-[11px] text-muted">{gm.find((m) => m.id === t.milestone_id)?.title}</div>}</div>{t.due && <span className={cx('text-xs', isOverdue(t.due, t.done) ? 'text-bad' : 'text-muted')}>{fmtDate(t.due)}</span>}<button onClick={() => tasks.remove(t.id)} className="text-muted hover:text-bad" aria-label="Delete task"><Trash2 className="w-3.5 h-3.5" /></button></div>) : <p className="text-sm text-muted">What is the very next physical action?</p>}
        </Card>
      </div>
      <Card><SectionTitle>Notes</SectionTitle><textarea rows={4} defaultValue={g.notes} key={g.id} onBlur={(e) => e.target.value !== g.notes && goals.save({ id: g.id, notes: e.target.value })} aria-label="Notes" /></Card>
    </div>
  );
}

function Execution() {
  const goals = useTable('goals'); const ms = useTable('milestones'); const tasks = useTable('tasks');
  const t = today();
  const goalName = (id: string | null) => goals.rows.find((g) => g.id === id)?.title;
  const overdueT = tasks.rows.filter((x) => isOverdue(x.due, x.done));
  const overdueM = ms.rows.filter((x) => isOverdue(x.due, x.done));
  const todayT = tasks.rows.filter((x) => !x.done && x.due === t);
  const open = tasks.rows.filter((x) => !x.done && (!x.due || x.due > t) && x.kind === 'task');
  const doneWeek = tasks.rows.filter((x) => x.done && x.done_at && x.done_at.slice(0, 10) >= new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)).length;
  const toggle = (x: Task) => { tasks.save({ id: x.id, done: !x.done, done_at: !x.done ? new Date().toISOString() : null }); if (!x.done) logActivity('task', 0, x.id); };
  const Row = ({ x }: { x: Task }) => <div className="flex items-center gap-3 py-2 border-t border-line first:border-0"><input type="checkbox" checked={x.done} onChange={() => toggle(x)} aria-label={x.title} /><div className="flex-1 min-w-0"><div className="text-sm">{x.title}</div>{x.goal_id && <Link to={`/goals/${x.goal_id}`} className="text-[11px] text-gold">{goalName(x.goal_id)}</Link>}</div>{x.due && <span className={cx('text-xs', isOverdue(x.due, x.done) ? 'text-bad' : 'text-muted')}>{fmtDate(x.due)}</span>}</div>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Overdue tasks', overdueT.length, overdueT.length > 0], ['Overdue milestones', overdueM.length, overdueM.length > 0], ['Due today', todayT.length, false], ['Completed this week', doneWeek, false]].map(([l, v, bad]) => <div key={l as string} className={cx('card p-4', !!bad && 'border-bad/40')}><div className="text-xs text-muted">{l}</div><div className={cx('text-3xl font-display', !!bad && 'text-bad')}>{v as number}</div></div>)}
      </div>
      {(overdueT.length > 0 || overdueM.length > 0) && <Card className="border-bad/30"><SectionTitle><span className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-bad" />Overdue</span></SectionTitle>{overdueT.map((x) => <Row key={x.id} x={x} />)}{overdueM.map((m) => <div key={m.id} className="flex items-center gap-3 py-2 border-t border-line"><input type="checkbox" checked={m.done} onChange={() => ms.save({ id: m.id, done: true })} aria-label={m.title} /><div className="flex-1 text-sm">Milestone: {m.title} <Link to={`/goals/${m.goal_id}`} className="text-[11px] text-gold">{goalName(m.goal_id)}</Link></div><span className="text-xs text-bad">{fmtDate(m.due)}</span></div>)}</Card>}
      <div className="grid md:grid-cols-2 gap-4">
        <Card><SectionTitle>Today</SectionTitle>{todayT.length ? todayT.map((x) => <Row key={x.id} x={x} />) : <p className="text-sm text-muted">Nothing scheduled for today.</p>}</Card>
        <Card><SectionTitle>Unfinished tasks</SectionTitle>{open.length ? open.slice(0, 20).map((x) => <Row key={x.id} x={x} />) : <p className="text-sm text-muted">No open tasks. Add tasks inside a goal.</p>}</Card>
      </div>
    </div>
  );
}

function Ideas() {
  const goals = useTable('goals'); const tasks = useTable('tasks'); const ms = useTable('milestones'); const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const projects = goals.rows.filter((g) => g.is_project);
  const journal = useTable('journal_entries');
  const ideaEntries = journal.rows.filter((e) => e.kind === 'idea' && !projects.some((p) => p.notes.includes(e.id)));
  const byStage = useMemo(() => Object.fromEntries(STAGES.map((s) => [s, projects.filter((p) => p.stage === s)])), [projects]);
  const create = async (g: Partial<Goal>, fromEntry?: string) => {
    const row = await goals.save({ ...g, is_project: true, stage: 'idea', status: 'active', notes: fromEntry ? `From journal entry ${fromEntry}` : '' });
    const r = await askAI('plan', [{ role: 'user', content: `Turn this idea into a realistic project plan across the stages research, validation, planning, execution, review: ${g.title}. ${g.description || ''}. Reply as JSON {"steps":[{"stage":"research","title":"..."}]}` }], { idea: g.title });
    const parsed = extractJSON<{ steps: { stage?: string; title: string }[] }>(r.text);
    for (const s of (parsed?.steps || []).slice(0, 12)) {
      const stage = (STAGES as readonly string[]).includes(s.stage || '') ? s.stage : 'planning';
      await store.save('tasks', { goal_id: row.id, milestone_id: null, title: `[${stage}] ${s.title}`.slice(0, 160), due: null, done: false, done_at: null, kind: 'task', priority: 'medium' });
    }
    nav(`/goals/${row.id}`);
  };
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div><h3 className="text-2xl flex items-center gap-2"><Lightbulb className="w-5 h-5 text-gold" />Idea to Reality</h3><p className="text-sm text-muted mt-1">IDEA → RESEARCH → VALIDATION → PLANNING → EXECUTION → REVIEW → COMPLETION</p></div>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4" />New idea</Button>
        </div>
      </Card>
      {ideaEntries.length > 0 && <Card><SectionTitle>Ideas from your journal</SectionTitle>{ideaEntries.slice(0, 5).map((e) => <div key={e.id} className="flex items-center gap-3 py-2 border-t border-line first:border-0"><span className="flex-1 text-sm">{e.title || 'Untitled idea'}</span><Button size="sm" variant="outline" onClick={() => create({ title: e.title || 'Untitled idea', description: Object.values(e.answers).filter(Boolean).join('\n') || e.body, horizon: '90d', category: 'Business', priority: 'medium', deadline: null }, e.id)}>Turn into project <ArrowRight className="w-3.5 h-3.5" /></Button></div>)}</Card>}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {STAGES.map((s) => (
          <div key={s} className="min-w-[220px] w-[220px] shrink-0 snap-start">
            <div className="text-xs uppercase tracking-widest text-muted mb-2 flex justify-between"><span>{s}</span><span>{byStage[s].length}</span></div>
            <div className="space-y-2">{byStage[s].map((p) => {
              const pct = goalProgress(p, ms.rows, tasks.rows); const i = STAGES.indexOf(p.stage);
              return <div key={p.id} className="card p-3"><Link to={`/goals/${p.id}`} className="text-sm font-medium hover:text-gold">{p.title}</Link><Progress value={pct} className="mt-2" /><div className="flex justify-between mt-2">{i > 0 ? <button className="text-xs text-muted hover:text-ink" onClick={() => goals.save({ id: p.id, stage: STAGES[i - 1] as GoalStage, status: 'active' })}>← Back</button> : <span />}{i < STAGES.length - 1 && <button className="text-xs text-gold flex items-center" onClick={() => goals.save({ id: p.id, stage: STAGES[i + 1] as GoalStage, status: STAGES[i + 1] === 'completion' ? 'completed' : 'active' })}>Advance<ChevronRight className="w-3 h-3" /></button>}</div></div>;
            })}{!byStage[s].length && <div className="border border-dashed border-line rounded-xl p-3 text-xs text-muted text-center">Empty</div>}</div>
          </div>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="New idea">
        <p className="text-sm text-muted mb-3">The Architect will suggest research, validation and planning steps (template steps in demo mode).</p>
        <GoalForm project initial={{ horizon: '90d', category: 'Business' }} onCancel={() => setOpen(false)} onSubmit={async (g) => { await create(g); setOpen(false); }} />
      </Modal>
    </div>
  );
}
