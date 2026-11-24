import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, Flame, Landmark, Pencil, Play, RefreshCw, Target, Waves, NotebookPen, Sparkles } from 'lucide-react';
import { useTable } from '../lib/hooks';
import { logActivity, usePrefs } from '../lib/prefs';
import { Badge, Button, Card, Empty, LinkButton, Progress, SectionTitle } from '../components/ui';
import { PROGRAMMES, getProgramme } from '../content/hypnosis';
import { ALL_LESSONS, getLesson } from '../content/academy';
import { WEALTH_LESSONS } from '../content/wealth';
import { STATEMENTS } from '../content/programmes';
import { cx, fmtDate, streak, today, addDays } from '../lib/util';
import { goalProgress, isOverdue } from '../lib/goals';
import { player } from '../lib/player';

const OBJ_TO_SESSION: Record<string, string> = {
  'Sharper focus': 'concentration', 'Learn new subjects': 'memory', 'Financial confidence': 'financial-confidence', 'Build a business': 'entrepreneur',
  'Discipline & habits': 'discipline', Confidence: 'confidence', 'Better sleep': 'sleep', 'Creative thinking': 'creativity', 'Execute my goals': 'visualisation',
};
const dayOfYear = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

export default function Home() {
  const { prefs, update } = usePrefs();
  const activity = useTable('activity_log');
  const progress = useTable('session_progress');
  const lp = useTable('learning_progress');
  const goals = useTable('goals'); const ms = useTable('milestones'); const tasks = useTable('tasks');
  const journal = useTable('journal_entries');
  const personal = useTable('hypnosis_sessions');
  const [editStatement, setEditStatement] = useState(false);
  const [statement, setStatement] = useState(prefs.daily_statement);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const t = today();
  const days = useMemo(() => new Set([...activity.rows.map((a) => a.occurred_on), ...journal.rows.map((j) => j.entry_date)]), [activity.rows, journal.rows]);
  const currentStreak = streak(days);
  const checkin = activity.rows.find((a) => a.kind === 'checkin' && a.occurred_on === t);

  const completedLessons = new Set(lp.rows.map((r) => r.lesson_id));
  const nextLesson = ALL_LESSONS.find((l) => l.level === 'Beginner' && !completedLessons.has(l.id)) || ALL_LESSONS.find((l) => !completedLessons.has(l.id));
  const wealthAction = WEALTH_LESSONS[dayOfYear() % WEALTH_LESSONS.length];

  const recId = hour >= 21 ? 'sleep' : (prefs.objectives.map((o) => OBJ_TO_SESSION[o]).find((id) => id && !progress.rows.some((p) => p.session_id === id && p.completed_count > 0)) || 'lm-001');
  const rec = getProgramme(recId) || PROGRAMMES[0];
  const resume = [...progress.rows].filter((p) => p.char_index > 0 && p.last_played_at).sort((a, b) => (b.last_played_at! > a.last_played_at! ? 1 : -1))[0];
  const resumeTitle = resume && (getProgramme(resume.session_id)?.title || personal.rows.find((s) => s.id === resume.session_id)?.title);
  const lastLesson = [...lp.rows].sort((a, b) => (b.completed_at > a.completed_at ? 1 : -1))[0];

  const focus = prefs.focus?.date === t ? prefs.focus : { date: t, mind: '', wealth: '', execution: '', done: { mind: false, wealth: false, execution: false } };
  const setFocus = (patch: Partial<typeof focus>) => update({ focus: { ...focus, ...patch } });

  const activeGoals = goals.rows.filter((g) => g.status === 'active').slice(0, 3);
  const overdue = tasks.rows.filter((x) => isOverdue(x.due, x.done)).length + ms.rows.filter((x) => isOverdue(x.due, x.done)).length;
  const weekStart = addDays(t, -6);
  const week = activity.rows.filter((a) => a.occurred_on >= weekStart);
  const weekStats = {
    sessions: week.filter((a) => a.kind === 'session_complete').length,
    lessons: lp.rows.filter((r) => r.completed_at.slice(0, 10) >= weekStart).length,
    focus: week.filter((a) => a.kind === 'focus').reduce((n, a) => n + a.minutes, 0),
    journal: journal.rows.filter((j) => j.entry_date >= weekStart).length,
  };

  return (
    <div className="space-y-6">
      <header className="fade-in">
        <div className="text-[11px] tracking-[0.25em] uppercase text-gold">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1 className="text-4xl md:text-5xl font-semibold mt-1">{greeting}{prefs.display_name ? `, ${prefs.display_name}` : ''}.</h1>
        <div className="mt-3 flex items-start gap-2 group">
          {editStatement ? (
            <form className="flex gap-2 w-full max-w-xl" onSubmit={(e) => { e.preventDefault(); update({ daily_statement: statement.trim() || STATEMENTS[0] }); setEditStatement(false); }}>
              <input value={statement} onChange={(e) => setStatement(e.target.value)} maxLength={160} autoFocus aria-label="Daily statement" />
              <Button size="sm">Save</Button>
            </form>
          ) : (
            <>
              <p className="font-display text-xl md:text-2xl italic text-muted">“{prefs.daily_statement}”</p>
              <button onClick={() => { setStatement(prefs.daily_statement); setEditStatement(true); }} className="p-1 text-muted hover:text-gold" aria-label="Edit statement"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => { const i = STATEMENTS.indexOf(prefs.daily_statement); update({ daily_statement: STATEMENTS[(i + 1) % STATEMENTS.length] }); }} className="p-1 text-muted hover:text-gold" aria-label="Next statement"><RefreshCw className="w-4 h-4" /></button>
            </>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <SectionTitle>Today’s focus</SectionTitle>
          <div className="space-y-3">
            {([['mind', 'MIND', 'What am I learning today?'], ['wealth', 'WEALTH', 'What am I doing to improve my financial position?'], ['execution', 'EXECUTION', 'What am I completing today?']] as const).map(([k, label, q]) => (
              <div key={k} className="flex items-center gap-3">
                <button onClick={() => { const done = { ...focus.done, [k]: !focus.done[k] }; setFocus({ done }); if (!focus.done[k]) logActivity(k === 'wealth' ? 'wealth_action' : 'priority', 0, k); }}
                  className={cx('w-6 h-6 rounded-full border grid place-items-center shrink-0', focus.done[k] ? 'bg-gold border-gold text-black' : 'border-line')} aria-label={`Mark ${label} done`}>
                  {focus.done[k] && <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1">
                  <div className="text-[10px] tracking-[0.2em] text-gold">{label}</div>
                  <input defaultValue={focus[k]} key={focus.date + k} onBlur={(e) => e.target.value !== focus[k] && setFocus({ [k]: e.target.value })} placeholder={q}
                    className={cx('!bg-transparent !border-0 !px-0 !py-1 !shadow-none', focus.done[k] && 'line-through text-muted')} aria-label={q} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle>Readiness check-in</SectionTitle>
          {checkin ? (
            <div className="text-sm">
              <p className="text-muted">Logged for today.</p>
              <ReadinessSummary ref_={checkin.ref} />
            </div>
          ) : <CheckIn onSave={(ref) => logActivity('checkin', 0, ref)} />}
          <div className="mt-4 pt-4 border-t border-line flex items-center gap-3">
            <Flame className="w-6 h-6 text-gold" />
            <div><div className="text-2xl font-display font-semibold">{currentStreak} day{currentStreak === 1 ? '' : 's'}</div><div className="text-xs text-muted">development streak</div></div>
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <div className="text-[10px] tracking-[0.2em] text-gold flex items-center gap-1.5"><Waves className="w-3.5 h-3.5" />RECOMMENDED SESSION</div>
          <h3 className="text-2xl mt-2">{rec.title}</h3>
          <p className="text-sm text-muted mt-1 line-clamp-2">{rec.objective}</p>
          <div className="flex items-center gap-2 mt-4">
            <LinkButton to={`/hypnosis/session/${rec.id}`} variant="gold" size="sm"><Play className="w-3.5 h-3.5" />Begin · {rec.minutes} min</LinkButton>
          </div>
        </Card>
        <Card>
          <div className="text-[10px] tracking-[0.2em] text-gold flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />DAILY LEARNING OBJECTIVE</div>
          {nextLesson ? <>
            <h3 className="text-2xl mt-2">{nextLesson.title}</h3>
            <p className="text-sm text-muted mt-1">{nextLesson.subjectName} · {nextLesson.level} · {nextLesson.minutes} min</p>
            <LinkButton to={`/academy/lesson/${nextLesson.id}`} size="sm" className="mt-4">Start lesson <ArrowRight className="w-3.5 h-3.5" /></LinkButton>
          </> : <p className="text-sm text-muted mt-2">You have completed every lesson. Explore Connect the Knowledge.</p>}
        </Card>
        <Card>
          <div className="text-[10px] tracking-[0.2em] text-gold flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" />TODAY’S WEALTH ACTION</div>
          <h3 className="text-2xl mt-2">{wealthAction.title}</h3>
          <p className="text-sm text-muted mt-1">{wealthAction.action}</p>
          <LinkButton to="/wealth" size="sm" className="mt-4">Open Wealth Lab <ArrowRight className="w-3.5 h-3.5" /></LinkButton>
        </Card>
      </div>

      {(resume || lastLesson) && (
        <Card>
          <SectionTitle>Continue where you left off</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {resume && resumeTitle && (
              <Link to={`/hypnosis/session/${resume.session_id}`} className="flex items-center gap-3 p-3 rounded-xl bg-raised/60 hover:bg-raised">
                <div className="w-10 h-10 rounded-full bg-gold/15 text-gold grid place-items-center"><Play className="w-4 h-4" /></div>
                <div className="min-w-0"><div className="text-sm truncate">{resumeTitle}</div><div className="text-xs text-muted">Resume session</div></div>
              </Link>
            )}
            {lastLesson && getLesson(lastLesson.lesson_id) && (() => {
              const l = getLesson(lastLesson.lesson_id)!;
              const next = ALL_LESSONS.find((x) => x.subjectId === l.subjectId && !completedLessons.has(x.id));
              return (
                <Link to={next ? `/academy/lesson/${next.id}` : `/academy/subject/${l.subjectId}`} className="flex items-center gap-3 p-3 rounded-xl bg-raised/60 hover:bg-raised">
                  <div className="w-10 h-10 rounded-full bg-gold/15 text-gold grid place-items-center"><BookOpen className="w-4 h-4" /></div>
                  <div className="min-w-0"><div className="text-sm truncate">{next ? next.title : l.subjectName}</div><div className="text-xs text-muted">{next ? `Next in ${l.subjectName}` : 'Subject complete: revise'}</div></div>
                </Link>
              );
            })()}
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <SectionTitle action={<Link to="/goals" className="text-sm text-gold">All goals</Link>}><span className="flex items-center gap-2"><Target className="w-5 h-5 text-gold" />Current goals</span></SectionTitle>
          {overdue > 0 && <Link to="/goals" className="block mb-3"><Badge tone="bad">{overdue} overdue item{overdue > 1 ? 's' : ''}</Badge></Link>}
          {activeGoals.length ? <div className="space-y-4">{activeGoals.map((g) => {
            const pct = goalProgress(g, ms.rows, tasks.rows);
            return <Link key={g.id} to={`/goals/${g.id}`} className="block"><div className="flex justify-between text-sm mb-1.5"><span>{g.title}</span><span className="text-muted">{pct}%</span></div><Progress value={pct} /></Link>;
          })}</div> : <Empty title="No active goals" text="Define one meaningful goal to give your days direction." action={<LinkButton to="/goals?new=1" size="sm" variant="gold">Create a goal</LinkButton>} />}
        </Card>
        <Card>
          <SectionTitle action={<Link to="/journal" className="text-sm text-gold">Journal</Link>}><span className="flex items-center gap-2"><NotebookPen className="w-5 h-5 text-gold" />Recent entries</span></SectionTitle>
          {journal.rows.length ? <div className="divide-y divide-line">{[...journal.rows].sort((a, b) => (b.created_at > a.created_at ? 1 : -1)).slice(0, 3).map((j) => (
            <Link key={j.id} to={`/journal/${j.id}`} className="block py-2.5 first:pt-0"><div className="text-sm">{j.title || 'Untitled entry'}</div><div className="text-xs text-muted">{fmtDate(j.entry_date)} · {j.kind}</div></Link>
          ))}</div> : <Empty title="Your journal is empty" text="Start with a morning entry: four questions, two minutes." action={<LinkButton to="/journal/new?template=morning" size="sm" variant="gold">Write morning entry</LinkButton>} />}
        </Card>
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-4">
        <Card>
          <SectionTitle action={<Link to="/progress" className="text-sm text-gold">Details</Link>}>This week</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['Sessions completed', weekStats.sessions], ['Lessons completed', weekStats.lessons], ['Focus minutes', weekStats.focus], ['Journal entries', weekStats.journal]].map(([l, v]) => (
              <div key={l as string} className="bg-raised/50 rounded-xl p-3"><div className="text-2xl font-display font-semibold">{v}</div><div className="text-xs text-muted">{l}</div></div>
            ))}
          </div>
          <p className="text-[11px] text-muted mt-3">Counts reflect what you have logged in the app. They measure practice, not intelligence or wealth.</p>
        </Card>
        <Card>
          <SectionTitle>Quick audio</SectionTitle>
          <div className="space-y-1.5">
            {['lm-001', 'concentration', 'sleep', 'discipline'].map((id) => { const p = getProgramme(id)!; return (
              <button key={id} onClick={() => player.load({ id: p.id, title: p.title, chapters: p.chapters, category: p.category })} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-raised text-left">
                <Play className="w-4 h-4 text-gold" /><span className="text-sm flex-1 truncate">{p.title}</span><span className="text-xs text-muted">{p.minutes}m</span>
              </button>); })}
          </div>
          <LinkButton to="/mentor" size="sm" className="w-full mt-3"><Sparkles className="w-3.5 h-3.5" />Ask The Architect</LinkButton>
        </Card>
      </div>
    </div>
  );
}

function CheckIn({ onSave }: { onSave: (ref: string) => void }) {
  const [v, setV] = useState({ mood: 3, energy: 3, clarity: 3 });
  return (
    <div className="space-y-3">
      {(['mood', 'energy', 'clarity'] as const).map((k) => (
        <div key={k}>
          <div className="flex justify-between text-xs text-muted capitalize"><span>{k}</span><span>{v[k]}/5</span></div>
          <div className="flex gap-1 mt-1">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setV({ ...v, [k]: n })} className={cx('flex-1 h-7 rounded-md text-xs', n <= v[k] ? 'bg-gold/80 text-black' : 'bg-raised text-muted')} aria-label={`${k} ${n}`}>{n}</button>)}</div>
        </div>
      ))}
      <Button size="sm" className="w-full" onClick={() => onSave(`${v.mood},${v.energy},${v.clarity}`)}>Log check-in</Button>
    </div>
  );
}
function ReadinessSummary({ ref_ }: { ref_: string }) {
  const [m, e, c] = ref_.split(',').map(Number);
  const avg = (m + e + c) / 3;
  const tip = avg < 2.5 ? 'Low readiness. Keep today simple: one priority, a short breathing exercise, early night.' : avg < 3.8 ? 'Moderate readiness. Protect one focus block for your most important task.' : 'High readiness. A good day to tackle your hardest task first.';
  return <div className="mt-2"><div className="flex gap-3 text-xs text-muted"><span>Mood {m}</span><span>Energy {e}</span><span>Clarity {c}</span></div><p className="mt-2">{tip}</p></div>;
}
