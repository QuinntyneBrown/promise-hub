import type { FeedbackMode } from './feedback-mode';

/** A quiz's rules as the builder saves them. */
export interface QuizSettings {
  title: string;
  /** Null for the whole module. */
  lessonId: string | null;
  passMark: number;
  /** Null for unlimited. */
  attemptsAllowed: number | null;
  feedback: FeedbackMode;
  shuffle: boolean;
  requiredToComplete: boolean;
}
