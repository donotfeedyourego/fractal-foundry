import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrefs } from '../lib/prefs';
import { Button, Field } from '../components/ui';
import { InfinityMark } from '../components/Logo';
import { cx } from '../lib/util';
import { DEFAULT_ROUTINE } from '../content/programmes';
import type { RoutineStep } from '../lib/types';

const OBJECTIVES = ['Sharper focus', 'Learn new subjects', 'Financial confidence', 'Build a business', 'Discipline & habits', 'Confidence', 'Better sleep', 'Creative thinking', 'Execute my goals'];
const STYLES = [['reading', 'Reading & notes'], ['listening', 'Listening & audio'], ['doing', 'Practice & exercises'], ['mixed', 'A mix of everything']];
const TONES = [['direct', 'Direct and challenging'], ['warm', 'Warm and encouraging'], ['calm', 'Calm and reflective'], ['analytical', 'Analytical and precise']];

export default function Onboarding() {
  const { prefs, update } = usePrefs();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [d, setD] = useState({ display_name: prefs.display_name, objectives: prefs.objectives, learning_style: prefs.learning_style, financial_ambition: prefs.financial_ambition, session_length: prefs.session_length, daily_minutes: prefs.daily_minutes, coaching_tone: prefs.coaching_tone });
  const [busy, setBusy] = useState(false);
  const finish = async (skip = false) => {
    setBusy(true);
    await update({ ...(skip ? {} : d), onboarded: true, routine: prefs.routine || (DEFAULT_ROUTINE as unknown as RoutineStep[]) });
    nav('/');
  };
  const chip = (on: boolean) => cx('px-3.5 py-2 rounded-xl border text-sm transition', on ? 'border-gold bg-gold/10 text-ink' : 'border-line text-muted hover:border-gold/40');
  const steps = [
    { title: 'Welcome', body: (
      <div className="space-y-4">
        <p className="text-muted">A personal operating system for your mind, knowledge, wealth and execution. A few questions will tailor your dashboard. You can change everything later.</p>
        <Field label="What should we call you?"><input value={d.display_name} onChange={(e) => setD({ ...d, display_name: e.target.value })} placeholder="Your first name" maxLength={40} /></Field>
      </div>) },
    { title: 'Your primary objectives', body: (
      <div className="flex flex-wrap gap-2">{OBJECTIVES.map((o) => <button key={o} className={chip(d.objectives.includes(o))} onClick={() => setD({ ...d, objectives: d.objectives.includes(o) ? d.objectives.filter((x) => x !== o) : [...d.objectives, o] })}>{o}</button>)}</div>) },
    { title: 'How do you learn best?', body: (
      <div className="grid sm:grid-cols-2 gap-2">{STYLES.map(([id, l]) => <button key={id} className={chip(d.learning_style === id)} onClick={() => setD({ ...d, learning_style: id })}>{l}</button>)}</div>) },
    { title: 'Financial ambitions', body: (
      <Field label="In a sentence, what would you like to change financially?" hint="For example: build a 3-month emergency fund, launch a side business, understand investing.">
        <textarea rows={3} value={d.financial_ambition} onChange={(e) => setD({ ...d, financial_ambition: e.target.value })} maxLength={300} />
      </Field>) },
    { title: 'Your time', body: (
      <div className="space-y-6">
        <Field label={`Preferred session length: ${d.session_length} minutes`}><input type="range" min={5} max={45} step={5} value={d.session_length} onChange={(e) => setD({ ...d, session_length: +e.target.value })} /></Field>
        <Field label={`Daily time available: ${d.daily_minutes} minutes`}><input type="range" min={10} max={180} step={5} value={d.daily_minutes} onChange={(e) => setD({ ...d, daily_minutes: +e.target.value })} /></Field>
      </div>) },
    { title: 'Coaching tone', body: (
      <div className="grid sm:grid-cols-2 gap-2">{TONES.map(([id, l]) => <button key={id} className={chip(d.coaching_tone === id)} onClick={() => setD({ ...d, coaching_tone: id })}>{l}</button>)}</div>) },
  ];
  const s = steps[step];
  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-xl card p-6 md:p-8 fade-in" key={step}>
        <div className="flex items-center justify-between mb-6">
          <InfinityMark className="w-12 h-6" />
          <button className="text-sm text-muted hover:text-ink" onClick={() => finish(true)} disabled={busy}>Skip for now</button>
        </div>
        <div className="flex gap-1 mb-6">{steps.map((_, i) => <div key={i} className={cx('h-1 flex-1 rounded-full', i <= step ? 'bg-gold' : 'bg-line')} />)}</div>
        <h1 className="text-3xl font-semibold mb-4">{s.title}</h1>
        {s.body}
        <div className="flex justify-between mt-8">
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>Back</Button>
          {step < steps.length - 1 ? <Button onClick={() => setStep(step + 1)}>Continue</Button> : <Button onClick={() => finish()} loading={busy}>Enter The Limitless Mind</Button>}
        </div>
      </div>
    </div>
  );
}
