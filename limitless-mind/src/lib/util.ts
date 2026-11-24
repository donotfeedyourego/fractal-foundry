export const uid = () =>
  (globalThis.crypto && 'randomUUID' in crypto) ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); });

/** Local calendar date as YYYY-MM-DD. */
export const today = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return today(d); };
export const daysBetween = (a: string, b: string) => Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);
export const fmtDate = (iso: string | null | undefined) => iso ? new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export const wordsToMinutes = (text: string, wpm = 130) => Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / wpm));

/** Consecutive-day streak ending today (or yesterday if today isn't logged yet). */
export function streak(dates: Iterable<string>): number {
  const set = new Set(dates);
  let d = today();
  if (!set.has(d)) d = addDays(d, -1);
  let n = 0;
  while (set.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

export function download(filename: string, data: string, mime = 'application/json') {
  const blob = new Blob([data], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
