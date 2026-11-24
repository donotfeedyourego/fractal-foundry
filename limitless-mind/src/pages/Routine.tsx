import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ChevronRight, Moon, Plus, Sun, Sunrise, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Notice, PageHeader, Progress, SectionTitle } from '../components/ui';
import { useLocalState, useTable } from '../lib/hooks';
import { logActivity, usePrefs } from '../lib/prefs';
import { DEFAULT_ROUTINE, PLANS } from '../content/programmes';
import { cx, daysBetween, today, uid } from '../lib/util';
import { store } from '../lib/store';
import type { RoutineStep } from '../lib/types';

const PERIODS = [{ id: 'morning', label: 'Morning', icon: Sunrise }, { id: 'afternoon', label: 'Afternoon', icon: Sun }, { id: 'evening', label: 'Evening', icon: Moon }] as const;

export default function Routine() {
  const { prefs, update } = usePrefs();
  const a = useTable('activity_log');
  const routine: RoutineStep[] = prefs.routine || (DEFAULT_ROUTINE as unknown as RoutineStep[]);
  const t = today();
  const doneToday = new Set(a.rows.filter((x) => x.kind === 'routine' && x.occurred_on === t).map((x) => x.ref));
  const [editing, setEditing] = useState(false);
  const [newStep, setNewStep] = useState<Record<string, string>>({});
  const toggle = async (s: RoutineStep) => {
    if (doneToday.has(s.id)) { const row = a.rows.find((x) => x.kind === 'routine' && x.occurred_on === t && x.ref === s.id); if (row) await store.remove('activity_log', row.id); }
    else await logActivity('routine', 0, s.id);
  };
  const setRoutine = (r: RoutineStep[]) => update({ routine: r });
  const pct = routine.length ? Math.round((routine.filter((s) => doneToday.has(s.id)).length / routine.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Daily Routine" title="A day designed on purpose." subtitle="Morning preparation, afternoon execution, evening reflection. Customise every step."
        actions={<Button variant="outline" onClick={() => setEditing(!editing)}>{editing ? 'Done editing' : 'Customise routine'}</Button>} />
      <Card className="p-4"><div className="flex justify-between text-sm mb-2"><span>Today’s routine</span><span>{pct}%</span></div><Progress value={pct} /></Card>
      <div className="grid md:grid-cols-3 gap-4">
        {PERIODS.map((p) => {
          const steps = routine.filter((s) => s.period === p.id);
          return (
            <Card key={p.id}>
              <SectionTitle><span className="flex items-center gap-2"><p.icon className="w-5 h-5 text-gold" />{p.label}</span></SectionTitle>
              <div className="space-y-1">{steps.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-1.5">
                  <button onClick={() => toggle(s)} className={cx('w-6 h-6 rounded-full border grid place-items-center shrink-0', doneToday.has(s.id) ? 'bg-gold border-gold text-black' : 'border-line')} aria-label={`Complete ${s.title}`}>{doneToday.has(s.id) && <Check className="w-3.5 h-3.5" />}</button>
                  {editing ? <input defaultValue={s.title} onBlur={(e) => setRoutine(routine.map((x) => x.id === s.id ? { ...x, title: e.target.value || x.title } : x))} className="!py-1.5 text-sm" aria-label="Step title" />
                    : <Link to={s.link || '/'} className={cx('flex-1 text-sm hover:text-gold', doneToday.has(s.id) && 'line-through text-muted')}>{s.title}</Link>}
                  {editing ? <button onClick={() => setRoutine(routine.filter((x) => x.id !== s.id))} className="text-muted hover:text-bad" aria-label="Remove step"><Trash2 className="w-4 h-4" /></button> : <span className="text-xs text-muted">{s.minutes}m</span>}
                </div>))}</div>
              {editing && <form className="flex gap-2 mt-3" onSubmit={(e) => { e.preventDefault(); const v = newStep[p.id]?.trim(); if (v) { setRoutine([...routine, { id: uid(), period: p.id, title: v, minutes: 10, link: '/' }]); setNewStep({ ...newStep, [p.id]: '' }); } }}><input value={newStep[p.id] || ''} onChange={(e) => setNewStep({ ...newStep, [p.id]: e.target.value })} placeholder="Add step" className="!py-1.5 text-sm" aria-label={`Add ${p.label} step`} /><Button size="sm" variant="outline" aria-label="Add"><Plus className="w-4 h-4" /></Button></form>}
            </Card>
          );
        })}
      </div>
      {editing && <button className="text-sm text-muted hover:text-ink" onClick={() => setRoutine(DEFAULT_ROUTINE as unknown as RoutineStep[])}>Reset to default routine</button>}
      <Reminders />
      <SectionTitle>Programmes</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4">{PLANS.map((plan) => <PlanCard key={plan.id} planId={plan.id} />)}</div>
    </div>
  );
}

function PlanCard({ planId }: { planId: string }) {
  const plan = PLANS.find((p) => p.id === planId)!;
  const a = useTable('activity_log');
  const startRow = [...a.rows].filter((x) => x.kind === 'programme_start' && x.ref === planId).sort((x, y) => y.created_at.localeCompare(x.created_at))[0];
  const doneDays = new Set(a.rows.filter((x) => x.kind === 'programme_day' && x.ref.startsWith(planId + ':') && (!startRow || x.created_at >= startRow.created_at)).map((x) => Number(x.ref.split(':')[1])));
  const [open, setOpen] = useState(false);
  const current = startRow ? Math.min(plan.days.length, daysBetween(startRow.occurred_on, today()) + 1) : 0;
  const day = plan.days[Math.max(0, current - 1)];
  return (
    <Card>
      <div className="flex justify-between items-start gap-2"><h3 className="text-2xl">{plan.title}</h3>{startRow && <Badge tone="gold">Day {current}/{plan.days.length}</Badge>}</div>
      <p className="text-sm text-muted mt-1">{plan.summary}</p>
      {startRow ? (
        <div className="mt-4 space-y-3">
          <Progress value={(doneDays.size / plan.days.length) * 100} />
          <div className="text-xs text-muted">{doneDays.size} of {plan.days.length} days completed</div>
          <div className="p-4 rounded-xl bg-raised/50"><div className="text-xs text-gold uppercase tracking-wider">Today · Day {day.day}</div><div className="font-medium mt-1">{day.title}</div>
            <ul className="mt-2 space-y-1">{day.tasks.map((t) => <li key={t.label}><Link to={t.link} className="text-sm text-muted hover:text-gold flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" />{t.label}</Link></li>)}</ul>
            <Button size="sm" className="mt-3" disabled={doneDays.has(day.day)} onClick={() => logActivity('programme_day', 0, `${planId}:${day.day}`)}>{doneDays.has(day.day) ? 'Day complete ✓' : 'Mark day complete'}</Button></div>
          <div className="flex gap-3"><button className="text-sm text-gold" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'View'} full plan</button><button className="text-sm text-muted" onClick={() => confirm('Restart this programme from day 1?') && logActivity('programme_start', 0, planId)}>Restart</button></div>
          {open && <div className="max-h-72 overflow-y-auto divide-y divide-line">{plan.days.map((d) => <div key={d.day} className="py-2 flex gap-3 text-sm"><span className={cx('w-8 shrink-0', doneDays.has(d.day) ? 'text-good' : 'text-muted')}>{doneDays.has(d.day) ? '✓' : d.day}</span><span>{d.title}</span></div>)}</div>}
        </div>
      ) : <Button className="mt-4" onClick={() => logActivity('programme_start', 0, planId)}>Start programme</Button>}
    </Card>
  );
}

function Reminders() {
  const { prefs, update } = usePrefs();
  const [times, setTimes] = useLocalState('lm.reminders', { morning: '07:30', afternoon: '13:30', evening: '21:00' });
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  useEffect(() => {
    if (!prefs.notifications || perm !== 'granted') return;
    const fired = new Set<string>();
    const i = setInterval(() => {
      const now = new Date(); const hm = now.toTimeString().slice(0, 5);
      (Object.entries(times) as [string, string][]).forEach(([k, v]) => {
        const key = `${today()}-${k}`;
        if (v === hm && !fired.has(key)) { fired.add(key); try { new Notification('The Limitless Mind', { body: `Time for your ${k} routine.`, icon: 'favicon.svg' }); } catch { /* */ } }
      });
    }, 20000);
    return () => clearInterval(i);
  }, [prefs.notifications, perm, times]);
  const enable = async () => { if (typeof Notification === 'undefined') return; const p = await Notification.requestPermission(); setPerm(p); if (p === 'granted') update({ notifications: true }); };
  return (
    <Card>
      <SectionTitle><span className="flex items-center gap-2"><Bell className="w-5 h-5 text-gold" />Reminders</span></SectionTitle>
      {perm === 'unsupported' ? <Notice tone="muted">This browser does not support notifications.</Notice> : !prefs.notifications || perm !== 'granted' ? (
        <div className="space-y-2"><p className="text-sm text-muted">Reminders are off. Nothing is sent until you grant permission.</p><Button size="sm" onClick={enable}>Enable reminders</Button>{perm === 'denied' && <p className="text-xs text-bad">Notifications are blocked in your browser settings.</p>}</div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">{(['morning', 'afternoon', 'evening'] as const).map((k) => <label key={k} className="text-sm space-y-1"><span className="text-muted capitalize">{k}</span><input type="time" value={times[k]} onChange={(e) => setTimes({ ...times, [k]: e.target.value })} /></label>)}</div>
          <p className="text-xs text-muted">Reminders appear while The Limitless Mind is open in a browser tab or installed app window. <button className="text-gold" onClick={() => update({ notifications: false })}>Turn off</button></p>
        </div>
      )}
    </Card>
  );
}
