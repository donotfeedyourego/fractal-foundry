// Row shapes mirror the Supabase tables in supabase/migrations exactly (snake_case).
export interface Row { id: string; user_id?: string; created_at: string; updated_at: string }

export interface Preferences extends Row {
  onboarded: boolean;
  display_name: string;
  objectives: string[];
  learning_style: string;
  financial_ambition: string;
  session_length: number;
  daily_minutes: number;
  coaching_tone: string;
  theme: 'dark' | 'light';
  daily_statement: string;
  focus: { date: string; mind: string; wealth: string; execution: string; done: { mind: boolean; wealth: boolean; execution: boolean } } | null;
  routine: RoutineStep[] | null;
  journal_ai_consent: boolean;
  notifications: boolean;
  currency: string;
}
export interface RoutineStep { id: string; period: 'morning' | 'afternoon' | 'evening'; title: string; link?: string; minutes: number }

export interface Chapter { title: string; text: string }
export interface HypnosisSession extends Row {
  title: string; category: string; objective: string; chapters: Chapter[];
  source: 'generated' | 'template' | 'custom' | 'edited_copy'; base_id: string | null;
  duration_min: number; tone: string; reflection: string[];
}
export interface SessionProgress extends Row {
  session_id: string; chapter: number; char_index: number; completed_count: number;
  favourite: boolean; last_played_at: string | null; seconds_listened: number;
}
export interface JournalEntry extends Row {
  kind: string; title: string; body: string; answers: Record<string, string>;
  tags: string[]; mood: number | null; is_private: boolean; entry_date: string;
}
export interface Affirmation extends Row { text: string; category: string; pinned: boolean }
export interface LearningSubject extends Row { subject_id: string; level: string; enrolled: boolean }
export interface LearningModule extends Row { lesson_id: string; subject_id: string; notes: string; bookmarked: boolean }
export interface LearningProgress extends Row { lesson_id: string; subject_id: string; level: string; completed_at: string; minutes: number }
export interface Flashcard extends Row { deck: string; front: string; back: string; srs: Record<string, unknown> | null; due: string; source: string }
export interface QuizResult extends Row { quiz_id: string; subject_id: string; score: number; total: number }
export type GoalHorizon = 'short' | '30d' | '90d' | 'annual';
export type GoalStage = 'idea' | 'research' | 'validation' | 'planning' | 'execution' | 'review' | 'completion';
export interface Goal extends Row {
  title: string; description: string; horizon: GoalHorizon; category: string; deadline: string | null;
  priority: 'low' | 'medium' | 'high'; status: 'active' | 'completed' | 'paused'; notes: string;
  is_project: boolean; stage: GoalStage;
}
export interface Milestone extends Row { goal_id: string; title: string; due: string | null; done: boolean }
export interface Task extends Row {
  goal_id: string | null; milestone_id: string | null; title: string; due: string | null;
  done: boolean; done_at: string | null; kind: 'task' | 'commitment' | 'wealth_action'; priority: 'low' | 'medium' | 'high';
}
export interface Habit extends Row { title: string; category: string; log: string[]; archived: boolean }
export interface WealthRecord extends Row {
  kind: 'revenue' | 'expense' | 'saving' | 'business_income' | 'target';
  amount: number; category: string; note: string; record_date: string;
}
export interface AIConversation extends Row { title: string; saved: boolean }
export interface AIMessage extends Row { conversation_id: string; role: 'user' | 'assistant'; content: string; demo: boolean }
export interface SavedResource extends Row { title: string; url: string; subject_id: string; note: string }
export interface ActivityLog extends Row { kind: string; minutes: number; ref: string; occurred_on: string }
export interface Recording extends Row { title: string; kind: 'voice' | 'upload' | 'generated'; storage_path: string; duration_sec: number; mime: string; session_id: string | null }

export interface Tables {
  user_preferences: Preferences; hypnosis_sessions: HypnosisSession; session_progress: SessionProgress;
  journal_entries: JournalEntry; affirmations: Affirmation; learning_subjects: LearningSubject;
  learning_modules: LearningModule; learning_progress: LearningProgress; flashcards: Flashcard;
  quiz_results: QuizResult; goals: Goal; milestones: Milestone; tasks: Task; habits: Habit;
  wealth_records: WealthRecord; ai_conversations: AIConversation; ai_messages: AIMessage;
  saved_resources: SavedResource; activity_log: ActivityLog; recordings: Recording;
}
export type TableName = keyof Tables;
export const TABLES: TableName[] = [
  'user_preferences', 'hypnosis_sessions', 'session_progress', 'journal_entries', 'affirmations',
  'learning_subjects', 'learning_modules', 'learning_progress', 'flashcards', 'quiz_results', 'goals',
  'milestones', 'tasks', 'habits', 'wealth_records', 'ai_conversations', 'ai_messages', 'saved_resources',
  'activity_log', 'recordings',
];
