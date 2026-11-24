import { describe, expect, it } from 'vitest';
import { segment } from './tts';
import { streak, today, addDays } from './util';
import { demoReply } from './aiDemo';
import { generateSession } from '../content/generator';
import { PROGRAMMES, SESSION_001 } from '../content/hypnosis';
import { SUBJECTS, ALL_LESSONS } from '../content/academy';
import { LINKS } from '../content/connections';

describe('script segmentation', () => {
  it('splits sentences and [pause] markers per chapter', () => {
    const s = segment([{ text: 'Breathe in. Hold. [pause] Breathe out!' }, { text: 'Second chapter.' }]);
    expect(s.map((x) => (x.pause ? '|' : x.text))).toEqual(['Breathe in.', 'Hold.', '|', 'Breathe out!', 'Second chapter.']);
    expect(s.at(-1)!.chapter).toBe(1);
  });
});

describe('streak', () => {
  it('counts consecutive days ending today or yesterday', () => {
    const t = today();
    expect(streak([t, addDays(t, -1), addDays(t, -2), addDays(t, -4)])).toBe(3);
    expect(streak([addDays(t, -1), addDays(t, -2)])).toBe(2);
    expect(streak([addDays(t, -3)])).toBe(0);
  });
});

describe('demo AI is honest', () => {
  it('labels itself and challenges unrealistic claims', () => {
    const r = demoReply('mentor', [{ role: 'user', content: 'How do I get guaranteed returns overnight?' }], {});
    expect(r.demo).toBe(true);
    expect(r.text).toMatch(/Demo mode/);
    expect(r.text).toMatch(/no reliable way/);
  });
  it('plan mode returns parseable JSON steps', () => {
    const r = demoReply('plan', [{ role: 'user', content: 'x' }], { idea: 'Tutoring app' });
    expect(JSON.parse(r.text).steps.length).toBeGreaterThan(4);
  });
});

describe('content integrity', () => {
  it('Session 001 has the six required chapters', () => {
    expect(SESSION_001.chapters.map((c) => c.title)).toEqual(['1. Induction', '2. Reprogramming Your Identity', '3. Wealth Conditioning', '4. Intellectual Expansion', '5. The Execution Identity', '6. Return']);
  });
  it('12 additional programmes each include every required part', () => {
    expect(PROGRAMMES.length).toBe(13);
    for (const p of PROGRAMMES.slice(1)) {
      expect(p.chapters.map((c) => c.title)).toEqual(['Introduction', 'Breathing', 'Guided Session', 'Visualisation', 'Suggestions', 'Return to Alertness']);
      expect(p.reflection.length).toBeGreaterThan(0);
      p.chapters.forEach((c) => expect(c.text.trim().length).toBeGreaterThan(20));
    }
  });
  it('20 departments x 3 levels with valid quizzes', () => {
    expect(SUBJECTS.length).toBe(20);
    expect(ALL_LESSONS.length).toBe(60);
    for (const l of ALL_LESSONS) for (const q of l.quiz) expect(q.answer).toBeLessThan(q.options.length);
  });
  it('knowledge links reference real subjects', () => {
    const ids = new Set(SUBJECTS.map((s) => s.id));
    for (const l of LINKS) { expect(ids.has(l.a)).toBe(true); expect(ids.has(l.b)).toBe(true); }
  });
  it('generator produces the 7 required parts', () => {
    const g = generateSession({ improve: 'focus', behaviour: 'phone checking', achieve: 'exam', minutes: 15, tone: 'calm', style: 'motivational' });
    expect(g.chapters).toHaveLength(7);
    expect(g.reflection.length).toBe(3);
  });
});
