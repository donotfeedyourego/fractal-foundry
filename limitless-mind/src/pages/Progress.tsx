import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, PageHeader, SectionTitle, Stat, Notice, Tabs } from '../components/ui';
import { useTable } from '../lib/hooks';
import { addDays, streak, today } from '../lib/util';
import { ALL_LESSONS } from '../content/academy';

const tip = { background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line))', borderRadius: 12, fontSize: 12 };

export default function Progress() {
  const a = useTable('activity_log'); const lp = useTable('learning_progress'); const qr = useTable('quiz_results');
  const j = useTable('journal_entries'); const goals = useTable('goals'); const habits = useTable('habits'); const sp = useTable('session_progress');
  const [range, setRange] = useState<'week' | 'month'>('week');
  const t = today(); const days = range === 'week' ? 7 : 30;
  const dates = Array.from({ length: days }, (_, i) => addDays(t, i - days + 1));
  const start = dates[0];

  const daily = useMemo(() => dates.map((d) => {
    const day = a.rows.filter((x) => x.occurred_on === d);
    const sum = (k: string) => day.filter((x) => x.kind === k).reduce((n, x) => n + x.minutes, 0);
    return { date: d.slice(5), learning: sum('learning') + sum('quiz'), focus: sum('focus') + sum('attention'), listening: sum('listening'), journal: j.rows.filter((e) => e.entry_date === d).length, actions: day.filter((x) => ['wealth_action', 'business_action', 'task', 'commitment', 'milestone'].includes(x.kind)).length };
  }), [a.rows, j.rows, range]); // eslint-disable-line react-hooks/exhaustive-deps

  const inRange = a.rows.filter((x) => x.occurred_on >= start);
  const learningHours = (inRange.filter((x) => x.kind === 'learning' || x.kind === 'quiz').reduce((n, x) => n + x.minutes, 0) / 60).toFixed(1);
  const sessions = inRange.filter((x) => x.kind === 'session_complete').length;
  const focusN = inRange.filter((x) => x.kind === 'focus').length;
  const lessons = lp.rows.filter((r) => r.completed_at.slice(0, 10) >= start).length;
  const quizzes = qr.rows.filter((r) => r.created_at.slice(0, 10) >= start);
  const quizAvg = quizzes.length ? Math.round((quizzes.reduce((n, r) => n + r.score / Math.max(1, r.total), 0) / quizzes.length) * 100) : null;
  const journalDays = new Set(j.rows.filter((e) => e.entry_date >= start).map((e) => e.entry_date)).size;
  const goalsDone = goals.rows.filter((g) => g.status === 'completed').length;
  const goalRate = goals.rows.length ? Math.round((goalsDone / goals.rows.length) * 100) : null;
  const biz = inRange.filter((x) => ['wealth_action', 'business_action', 'wealth_record', 'wealth_lesson'].includes(x.kind)).length;
  const activeHabits = habits.rows.filter((h) => !h.archived);
  const habitRate = activeHabits.length ? Math.round((activeHabits.reduce((n, h) => n + dates.filter((d) => h.log.includes(d)).length, 0) / (activeHabits.length * days)) * 100) : null;
  const allDays = new Set([...a.rows.map((x) => x.occurred_on), ...j.rows.map((e) => e.entry_date)]);
  const habitSeries = dates.map((d) => ({ date: d.slice(5), done: activeHabits.filter((h) => h.log.includes(d)).length }));
  const empty = !a.rows.length && !j.rows.length;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="My Progress" title="Evidence of practice." subtitle="Everything here is calculated from what you have actually logged in the app." />
      <Tabs value={range} onChange={setRange} tabs={[{ id: 'week', label: 'Last 7 days' }, { id: 'month', label: 'Last 30 days' }]} />
      {empty && <Notice tone="muted">No activity yet. Complete a session, lesson, focus block or journal entry and your analytics will appear here.</Notice>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <Stat label="Current streak" value={`${streak(allDays)}d`} />
        <Stat label="Sessions completed" value={sessions} sub={`${sp.rows.reduce((n, r) => n + r.completed_count, 0)} all time`} />
        <Stat label="Learning hours" value={learningHours} />
        <Stat label="Lessons completed" value={lessons} sub={`${lp.rows.length}/${ALL_LESSONS.length} all time`} />
        <Stat label="Quizzes" value={quizzes.length} sub={quizAvg != null ? `avg ${quizAvg}%` : undefined} />
        <Stat label="Focus sessions" value={focusN} />
        <Stat label="Journal days" value={`${journalDays}/${days}`} />
        <Stat label="Habit consistency" value={habitRate == null ? '—' : `${habitRate}%`} />
        <Stat label="Goals achieved" value={goalsDone} sub={goalRate != null ? `${goalRate}% of all goals` : undefined} />
        <Stat label="Business actions" value={biz} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card><SectionTitle>Minutes per day</SectionTitle><div className="h-64"><ResponsiveContainer><BarChart data={daily}><CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" stroke="rgb(var(--muted))" fontSize={10} /><YAxis stroke="rgb(var(--muted))" fontSize={10} width={30} /><Tooltip contentStyle={tip} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar stackId="a" dataKey="learning" name="Learning" fill="rgb(var(--gold))" /><Bar stackId="a" dataKey="focus" name="Focus" fill="rgb(var(--goldsoft))" /><Bar stackId="a" dataKey="listening" name="Listening" fill="rgb(var(--muted))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><SectionTitle>Actions & journal</SectionTitle><div className="h-64"><ResponsiveContainer><LineChart data={daily}><CartesianGrid stroke="rgb(var(--line))" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" stroke="rgb(var(--muted))" fontSize={10} /><YAxis allowDecimals={false} stroke="rgb(var(--muted))" fontSize={10} width={30} /><Tooltip contentStyle={tip} /><Legend wrapperStyle={{ fontSize: 12 }} /><Line type="monotone" dataKey="actions" name="Completed actions" stroke="rgb(var(--gold))" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="journal" name="Journal entries" stroke="rgb(var(--good))" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></Card>
        {activeHabits.length > 0 && <Card className="lg:col-span-2"><SectionTitle>Habits completed per day ({activeHabits.length} active)</SectionTitle><div className="h-48"><ResponsiveContainer><BarChart data={habitSeries}><XAxis dataKey="date" stroke="rgb(var(--muted))" fontSize={10} /><YAxis allowDecimals={false} domain={[0, activeHabits.length]} stroke="rgb(var(--muted))" fontSize={10} width={25} /><Tooltip contentStyle={tip} /><Bar dataKey="done" name="Habits done" fill="rgb(var(--gold))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>}
      </div>
      <Notice tone="muted">These numbers track engagement and practice. They are not a measure of intelligence, wealth or personal transformation, which show up in real-world results over time.</Notice>
    </div>
  );
}
