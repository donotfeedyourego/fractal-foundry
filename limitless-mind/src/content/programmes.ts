/** Structured multi-week programmes. Each day links to real content inside the app. */
export interface ProgDay { day: number; title: string; tasks: { label: string; link: string }[] }
export interface ProgrammePlan { id: string; title: string; summary: string; days: ProgDay[] }

const t = (label: string, link: string) => ({ label, link });

const MIND30_THEMES = [
  ['Foundation: Session 001', [t('Listen: The Architect of Your Reality', '/hypnosis/session/lm-001'), t('Morning journal', '/journal/new?template=morning')]],
  ['Breathing and calm', [t('Breath counting exercise', '/mind/focus'), t('Evening journal', '/journal/new?template=evening')]],
  ['Focus baseline', [t('25-minute focus session', '/mind/focus'), t('Distraction audit', '/mind/focus')]],
  ['Memory basics', [t('Memory & Learning session', '/hypnosis/session/memory'), t('Create 5 flashcards', '/mind/memory')]],
  ['Habit design', [t('Create 2 habits', '/mind/discipline'), t('Lesson: Habits and Behaviour', '/academy/lesson/psychology-1')]],
  ['Thinking clearly', [t('Logic puzzles', '/mind/thinking'), t('Learn 2 cognitive biases', '/mind/thinking')]],
  ['Review week 1', [t('Weekly review in journal', '/journal/new?template=evening'), t('Check My Progress', '/progress')]],
];
const ROTATION = [
  ['Deep concentration', [t('Deep Concentration session', '/hypnosis/session/concentration'), t('50-minute deep work', '/mind/focus')]],
  ['Recall practice', [t('Review flashcards', '/mind/memory'), t('Complete one Academy lesson', '/academy')]],
  ['Discipline', [t('Discipline and Consistency session', '/hypnosis/session/discipline'), t('Check in habits', '/mind/discipline')]],
  ['Creative thinking', [t('Creative challenge', '/mind/creative'), t('Capture ideas in journal', '/journal/new?template=idea')]],
  ['Decision making', [t('Decision scenario', '/mind/thinking'), t('Ask The Architect to challenge a plan', '/mentor')]],
  ['Confidence', [t('Confidence and Self-Belief session', '/hypnosis/session/confidence'), t('Evidence list in journal', '/journal/new')]],
  ['Weekly review', [t('Evening review', '/journal/new?template=evening'), t('Progress check', '/progress')]],
];

export const MIND_30: ProgrammePlan = {
  id: 'mind-30', title: '30-Day Mental Development Programme',
  summary: 'Build daily habits of calm focus, recall, clear thinking and self-reflection. About 20–40 minutes per day.',
  days: Array.from({ length: 30 }, (_, i) => {
    const [title, tasks] = (i < 7 ? MIND30_THEMES[i] : ROTATION[(i - 7) % 7]) as [string, ProgDay['tasks']];
    return { day: i + 1, title: i === 29 ? 'Integration: Session 001 again' : title, tasks: i === 29 ? [t('Listen to Session 001 again', '/hypnosis/session/lm-001'), t('Write a 30-day reflection', '/journal/new?template=lesson')] : tasks };
  }),
};

const PHASES = [
  { name: 'Phase 1 · Foundations (Weeks 1–4)', focus: 'Set goals, build routines, beginner lessons', tasks: [t('Beginner lesson in a chosen subject', '/academy'), t('Focus session', '/mind/focus'), t('Advance one goal task', '/goals')] },
  { name: 'Phase 2 · Depth (Weeks 5–8)', focus: 'Intermediate lessons, first project milestones', tasks: [t('Intermediate lesson', '/academy'), t('Review flashcards', '/mind/memory'), t('Project milestone work', '/goals/ideas')] },
  { name: 'Phase 3 · Execution (Weeks 9–12)', focus: 'Advanced lessons, ship and review', tasks: [t('Advanced lesson or Connect the Knowledge', '/academy/connect'), t('Wealth action', '/wealth'), t('Weekly review with The Architect', '/mentor')] },
];
export const EXEC_90: ProgrammePlan = {
  id: 'exec-90', title: '90-Day Knowledge & Execution Programme',
  summary: 'Three 4-week phases plus a final review week (Days 85–90). Learn one subject from beginner to advanced while shipping one meaningful project.',
  days: Array.from({ length: 90 }, (_, i) => {
    const phase = PHASES[Math.min(2, Math.floor(i / 28))];
    const weekday = i % 7;
    if (i >= 84) return { day: i + 1, title: 'Final review & next 90 days', tasks: [t('Write a 90-day review', '/journal/new?template=lesson'), t('Set next quarter goals', '/goals')] };
    if (weekday === 6) return { day: i + 1, title: `${phase.name.split(' (')[0]}: weekly review`, tasks: [t('Evening review', '/journal/new?template=evening'), t('Check progress', '/progress')] };
    return { day: i + 1, title: `${phase.name.split(' (')[0]}: ${phase.focus}`, tasks: phase.tasks };
  }),
};
export const PLANS = [MIND_30, EXEC_90];

export const DEFAULT_ROUTINE = [
  { id: 'm1', period: 'morning', title: 'Mental check-in', link: '/', minutes: 1 },
  { id: 'm2', period: 'morning', title: 'Breathing exercise', link: '/mind/focus', minutes: 3 },
  { id: 'm3', period: 'morning', title: 'Guided mental preparation', link: '/hypnosis', minutes: 10 },
  { id: 'm4', period: 'morning', title: 'Daily learning', link: '/academy', minutes: 15 },
  { id: 'm5', period: 'morning', title: 'Identify three priorities', link: '/', minutes: 2 },
  { id: 'a1', period: 'afternoon', title: 'Focus session', link: '/mind/focus', minutes: 25 },
  { id: 'a2', period: 'afternoon', title: 'Business or wealth-building action', link: '/wealth', minutes: 20 },
  { id: 'a3', period: 'afternoon', title: 'Apply new knowledge', link: '/journal/new?template=lesson', minutes: 10 },
  { id: 'e1', period: 'evening', title: 'Reflection', link: '/journal/new?template=evening', minutes: 5 },
  { id: 'e2', period: 'evening', title: 'Review accomplishments', link: '/goals', minutes: 5 },
  { id: 'e3', period: 'evening', title: 'Plan tomorrow', link: '/goals', minutes: 5 },
  { id: 'e4', period: 'evening', title: 'Optional relaxation audio', link: '/hypnosis/session/sleep', minutes: 15 },
] as const;

export const STATEMENTS = [
  'Your mind is your greatest asset.',
  'Think beyond limitations. Learn without boundaries. Build without permission.',
  'Small actions, repeated, become a different life.',
  'Clarity first. Then courage. Then consistency.',
  'Learn something. Build something. Finish something.',
  'Patience is a strategy, not a delay.',
  'You do not rise to your goals. You fall to your systems.',
];
