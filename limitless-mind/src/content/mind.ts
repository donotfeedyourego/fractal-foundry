/** Mind Training exercise content. Original puzzles and scenarios. */
export const ATTENTION_EXERCISES = [
  { id: 'breath-count', title: 'Breath counting', minutes: 5, steps: ['Sit upright and close your eyes.', 'Count each out-breath from 1 to 10.', 'If you lose count or go past 10, gently restart at 1.', 'Notice: the restarting is the training, not a failure.'] },
  { id: 'single-object', title: 'Single-object focus', minutes: 3, steps: ['Pick an everyday object.', 'Observe it for three minutes: colour, texture, edges, shadows.', 'Each time your mind wanders, name the distraction ("planning", "worry") and return.'] },
  { id: 'sound-scan', title: 'Sound scanning', minutes: 4, steps: ['Close your eyes.', 'Notice the most distant sound you can hear, then the closest.', 'Move attention between sounds without labelling them good or bad.'] },
  { id: 'distraction-log', title: 'Distraction audit', minutes: 2, steps: ['Before a work block, write the three things most likely to distract you.', 'Remove or block each one (phone in another room, tabs closed, notifications off).', 'Keep a notepad to park unrelated thoughts during the block.'] },
];

export interface LogicPuzzle { id: string; q: string; options: string[]; answer: number; why: string; kind: string }
export const LOGIC: LogicPuzzle[] = [
  { id: 'l1', kind: 'Deduction', q: 'All architects are planners. Some planners are impatient. Which must be true?', options: ['Some architects are impatient', 'All impatient people are planners', 'Neither of these must be true', 'No architects are impatient'], answer: 2, why: 'The impatient planners might not include any architects.' },
  { id: 'l2', kind: 'Numeric', q: 'A bat and a ball cost £1.10 together. The bat costs £1.00 more than the ball. How much is the ball?', options: ['10p', '5p', '1p', '15p'], answer: 1, why: 'Ball = x, bat = x + 1.00; 2x + 1.00 = 1.10 → x = 0.05.' },
  { id: 'l3', kind: 'Rates', q: 'If 5 machines make 5 widgets in 5 minutes, how long do 100 machines take to make 100 widgets?', options: ['100 minutes', '5 minutes', '20 minutes', '1 minute'], answer: 1, why: 'Each machine makes one widget in 5 minutes.' },
  { id: 'l4', kind: 'Growth', q: 'A patch of lily pads doubles daily and covers a lake in 48 days. When did it cover half?', options: ['Day 24', 'Day 47', 'Day 36', 'Day 12'], answer: 1, why: 'It doubles to full on day 48, so half on day 47.' },
  { id: 'l5', kind: 'Conditional', q: 'Cards show A, K, 4, 7. Rule: "If a card has a vowel on one side, it has an even number on the other." Which must you turn over to test it?', options: ['A and 4', 'A and 7', 'A only', 'All four'], answer: 1, why: 'Only A (must be even) and 7 (must not be a vowel) can break the rule.' },
  { id: 'l6', kind: 'Probability', q: 'A family has two children. At least one is a girl. Assuming equal odds, what is the probability both are girls?', options: ['1/2', '1/3', '1/4', '2/3'], answer: 1, why: 'Equally likely cases with a girl: GG, GB, BG. One of three.' },
  { id: 'l7', kind: 'Base rates', q: 'A test is 90% accurate for a condition 1% of people have. You test positive. Roughly how likely are you to have it?', options: ['About 90%', 'About 50%', 'About 8%', 'About 1%'], answer: 2, why: 'Per 1,000: 9 true positives vs ~99 false positives → 9/108 ≈ 8%.' },
  { id: 'l8', kind: 'Sequence', q: 'What comes next: 2, 6, 12, 20, 30, ?', options: ['40', '42', '36', '44'], answer: 1, why: 'Differences rise by 2: +4, +6, +8, +10, +12.' },
  { id: 'l9', kind: 'Sunk cost', q: 'You paid £60 for a concert, but feel ill and would rather stay home. The ticket is non-refundable. What is the rational consideration?', options: ['Go, or you waste £60', 'Decide based only on which evening you’d prefer now', 'Sell your car', 'Buy another ticket'], answer: 1, why: 'The £60 is spent either way (sunk cost).' },
  { id: 'l10', kind: 'Deduction', q: 'Ana is taller than Ben. Ben is taller than Cy. Dee is shorter than Cy. Who is second shortest?', options: ['Ana', 'Ben', 'Cy', 'Dee'], answer: 2, why: 'Order: Ana > Ben > Cy > Dee.' },
];

export const BIASES = [
  { name: 'Confirmation bias', what: 'Seeking and favouring information that confirms what you already believe.', counter: 'Actively look for the strongest argument against your view.' },
  { name: 'Sunk cost fallacy', what: 'Continuing because of what you have already invested rather than future value.', counter: 'Ask: if I were starting fresh today, would I choose this?' },
  { name: 'Anchoring', what: 'Relying too heavily on the first number or idea you encounter.', counter: 'Generate your own estimate before looking at others.' },
  { name: 'Availability heuristic', what: 'Judging likelihood by how easily examples come to mind.', counter: 'Look up base rates and actual statistics.' },
  { name: 'Overconfidence', what: 'Being more certain than accuracy justifies.', counter: 'Give ranges, not points, and track your forecast accuracy.' },
  { name: 'Planning fallacy', what: 'Underestimating how long tasks will take.', counter: 'Use how long similar past tasks actually took, then add a buffer.' },
  { name: 'Survivorship bias', what: 'Focusing on successes that are visible and ignoring failures that are not.', counter: 'Ask how many tried the same thing and failed.' },
  { name: 'Loss aversion', what: 'Feeling losses more strongly than equal gains.', counter: 'Reframe decisions in terms of overall expected outcomes.' },
];

export const DECISIONS = [
  { id: 'd1', title: 'The job offer', scenario: 'You are offered a job paying 20% more, with a longer commute and less flexible hours. You have a goal to start a side business within a year.', prompts: ['What are your top three criteria and their weights?', 'What would make each option fail?', 'What would you advise a friend in your position?', 'Is this reversible? How cheaply could you test it?'] },
  { id: 'd2', title: 'The investment tip', scenario: 'A friend says a new coin "can’t lose" and has gone up 300% this month. They urge you to put in savings today.', prompts: ['What evidence would you need?', 'What happens if it falls 80%?', 'What biases might be at play (FOMO, social proof, recency)?', 'What would a sensible maximum exposure be, if any?'] },
  { id: 'd3', title: 'The product launch', scenario: 'Your product is 80% ready. Launch now with known minor issues, or wait three months to polish?', prompts: ['What do you learn by launching now?', 'What is the cost of delay?', 'Which issues would harm customers vs just annoy you?', 'What is a middle path?'] },
  { id: 'd4', title: 'Learning path', scenario: 'You have 5 hours a week. You want to learn programming, improve at sales and read more philosophy.', prompts: ['Which skill has the most leverage on your goals?', 'Could one support the others?', 'What does a 12-week plan look like?', 'What will you say no to?'] },
];

export const CREATIVE = {
  alternateUses: ['a paperclip', 'a brick', 'an empty jar', 'a spreadsheet', 'a bicycle wheel', 'an old phone', 'a cardboard box', 'a rope'],
  constraints: ['Explain a business idea using only words of one syllable.', 'Design a product for someone aged 90 and someone aged 9 at the same time.', 'Solve a problem in your life using only free resources.', 'Describe your work as if it were a recipe.', 'Combine two of your hobbies into one service.', 'Write a 6-word story about your next year.'],
  lateral: [
    { q: 'A man pushes his car to a hotel and tells the owner he is bankrupt. Why?', a: 'He is playing Monopoly.' },
    { q: 'How can you throw a ball as hard as you can and have it come back to you without hitting anything?', a: 'Throw it straight up.' },
    { q: 'What gets wetter the more it dries?', a: 'A towel.' },
    { q: 'A woman shoots her husband, holds him underwater, then hangs him. Later they go out to dinner. How?', a: 'She is a photographer: she shot a photo, developed it in water and hung it to dry.' },
    { q: 'Two people play five games of chess. Each wins the same number of games, with no draws. How?', a: 'They were not playing each other.' },
  ],
  patterns: [
    { seq: '1, 1, 2, 3, 5, 8, ?', a: '13', why: 'Each term is the sum of the previous two (Fibonacci).' },
    { seq: 'J, F, M, A, M, J, ?', a: 'J', why: 'First letters of the months: July.' },
    { seq: 'O, T, T, F, F, S, S, ?', a: 'E', why: 'One, Two, Three… Eight.' },
    { seq: '3, 9, 27, 81, ?', a: '243', why: 'Multiply by 3.' },
    { seq: '1, 4, 9, 16, 25, ?', a: '36', why: 'Square numbers.' },
  ],
  scamper: ['Substitute', 'Combine', 'Adapt', 'Modify / magnify', 'Put to another use', 'Eliminate', 'Reverse / rearrange'],
};

export const DISCIPLINE_CHALLENGES = [
  { id: 'c1', title: 'No phone for the first hour', days: 7, desc: 'Keep your phone out of reach for the first 60 minutes after waking.' },
  { id: 'c2', title: 'Two-minute starts', days: 7, desc: 'Each day, start your most-avoided task for just two minutes.' },
  { id: 'c3', title: 'Daily deep work', days: 14, desc: 'One uninterrupted 50-minute focus block every day.' },
  { id: 'c4', title: 'Spending pause', days: 30, desc: 'Wait 48 hours before any non-essential purchase over a set amount.' },
  { id: 'c5', title: 'Evening review', days: 21, desc: 'Write a 3-line evening review: done, learned, tomorrow.' },
  { id: 'c6', title: 'Read 10 pages', days: 30, desc: 'Read at least 10 pages of a non-fiction book daily.' },
];
