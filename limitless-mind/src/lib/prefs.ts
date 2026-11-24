import { useTable } from './hooks';
import { store } from './store';
import { Preferences } from './types';

export const DEFAULT_PREFS: Omit<Preferences, 'id' | 'created_at' | 'updated_at'> = {
  onboarded: false, display_name: '', objectives: [], learning_style: 'mixed', financial_ambition: '',
  session_length: 15, daily_minutes: 45, coaching_tone: 'direct', theme: 'dark',
  daily_statement: 'Your mind is your greatest asset.', focus: null, routine: null,
  journal_ai_consent: false, notifications: false, currency: 'GBP',
};

export function usePrefs() {
  const { rows, loading, save } = useTable('user_preferences');
  const row = rows[0];
  const prefs: Preferences = { ...(DEFAULT_PREFS as Preferences), ...(row || {}) };
  return {
    prefs, loading,
    update: (patch: Partial<Preferences>) => save({ ...(row ? { id: row.id } : {}), ...patch }),
  };
}

/** Record a measurable action (minutes spent, item completed). Feeds Progress analytics. */
export function logActivity(kind: string, minutes = 0, ref = '') {
  const d = new Date();
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return store.save('activity_log', { kind, minutes, ref, occurred_on: z }).catch(() => undefined);
}

export const CURRENCIES: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', AUD: 'A$', CAD: 'C$', JPY: '¥', INR: '₹', ZAR: 'R', NGN: '₦' };
export const money = (n: number, cur = 'GBP') =>
  (CURRENCIES[cur] ?? '') + (Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
