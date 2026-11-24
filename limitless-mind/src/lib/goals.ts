import type { Goal, Milestone, Task } from './types';
import { today } from './util';

export function goalProgress(g: Goal, ms: Milestone[], ts: Task[]) {
  if (g.status === 'completed') return 100;
  const m = ms.filter((x) => x.goal_id === g.id);
  const t = ts.filter((x) => x.goal_id === g.id);
  const items = [...m.map((x) => x.done), ...t.map((x) => x.done)];
  if (!items.length) return 0;
  return Math.round((items.filter(Boolean).length / items.length) * 100);
}
export const isOverdue = (due: string | null, done: boolean) => !!due && !done && due < today();
export const HORIZONS: Record<string, string> = { short: 'Short-term', '30d': '30-day', '90d': '90-day', annual: 'Annual' };
export const GOAL_CATEGORIES = ['Personal', 'Learning', 'Financial', 'Business', 'Health', 'Career'];
export const STAGES = ['idea', 'research', 'validation', 'planning', 'execution', 'review', 'completion'] as const;
