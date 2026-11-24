export interface Template { id: string; label: string; questions: string[] }
export const TEMPLATES: Template[] = [
  { id: 'free', label: 'Free writing', questions: [] },
  { id: 'morning', label: 'Morning', questions: ['How am I feeling?', 'What matters today?', 'What will I learn?', 'What will I execute?'] },
  { id: 'evening', label: 'Evening', questions: ['What did I accomplish?', 'What did I learn?', 'What distracted me?', 'What can I improve tomorrow?'] },
  { id: 'dream', label: 'Dream journal', questions: ['What happened?', 'Who was present?', 'What emotions did I experience?', 'What stood out?', 'What possible interpretations can I explore?'] },
  { id: 'idea', label: 'Idea', questions: ['What is the idea?', 'Who is it for?', 'Why now?', 'What is the first test?'] },
  { id: 'goal', label: 'Goal', questions: ['What do I want to achieve?', 'Why does it matter?', 'What is the deadline?', 'What is the first step?'] },
  { id: 'affirmation', label: 'Affirmations', questions: ['What do I want to believe more strongly?', 'What evidence supports it?'] },
  { id: 'hypnosis', label: 'Post-session reflection', questions: ['Which session did I complete?', 'What did I notice?', 'What action will I take?'] },
  { id: 'business', label: 'Business concept', questions: ['Problem', 'Customer', 'Solution', 'How it makes money', 'Risks'] },
  { id: 'lesson', label: 'Lesson learned', questions: ['What happened?', 'What did I learn?', 'What will I do differently?'] },
];
export const getTemplate = (id: string) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
