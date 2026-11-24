/** Spaced repetition using the open-source FSRS algorithm (github.com/open-spaced-repetition/ts-fsrs). */
import { createEmptyCard, fsrs, generatorParameters, Rating, type Grade, type CardInput } from 'ts-fsrs';
import { store } from './store';
import type { Flashcard } from './types';
import { logActivity } from './prefs';

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));
export { Rating };
export const GRADES: { g: Grade; label: string }[] = [
  { g: Rating.Again, label: 'Again' }, { g: Rating.Hard, label: 'Hard' }, { g: Rating.Good, label: 'Good' }, { g: Rating.Easy, label: 'Easy' },
];

export function newCardFields() {
  const c = createEmptyCard(new Date());
  return { srs: JSON.parse(JSON.stringify(c)) as Record<string, unknown>, due: c.due.toISOString() };
}

export function preview(card: Flashcard) {
  const now = new Date();
  const input = (card.srs || newCardFields().srs) as unknown as CardInput;
  return GRADES.map(({ g, label }) => {
    const next = scheduler.next(input, now, g).card;
    const mins = Math.max(1, Math.round((next.due.getTime() - now.getTime()) / 60000));
    return { g, label, interval: mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 1440)}d` };
  });
}

export async function review(card: Flashcard, g: Grade) {
  const input = (card.srs || newCardFields().srs) as unknown as CardInput;
  const { card: next } = scheduler.next(input, new Date(), g);
  await store.save('flashcards', { id: card.id, srs: JSON.parse(JSON.stringify(next)), due: next.due.toISOString() });
  await logActivity(g === Rating.Again ? 'review_fail' : 'review_pass', 0, card.id);
}

export async function addCards(deck: string, pairs: [string, string][], source: string) {
  const existing = await store.all('flashcards');
  let added = 0;
  for (const [front, back] of pairs) {
    if (existing.some((c) => c.front === front && c.deck === deck)) continue;
    await store.save('flashcards', { deck, front, back, source, ...newCardFields() });
    added++;
  }
  return added;
}
