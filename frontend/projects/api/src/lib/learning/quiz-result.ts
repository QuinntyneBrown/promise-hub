import type { FeedbackMode } from '../curriculum/feedback-mode';
import type { ReviewQuestion } from './review-question';

/**
 * A submitted attempt as its youth sees it (L2-076): while awaiting approval the score, pass and review are null or empty;
 * `attemptsLeft` is null with unlimited attempts.
 */
export interface QuizResult {
  attemptId: string;
  quizId: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  number: number;
  attemptsAllowed: number | null;
  attemptsUsed: number;
  attemptsLeft: number | null;
  status: 'scored' | 'awaiting-approval';
  submittedAt: string | null;
  score: number | null;
  correct: number | null;
  total: number | null;
  passMark: number;
  passed: boolean | null;
  bestScore: number | null;
  canRetake: boolean;
  feedback: FeedbackMode;
  review: ReviewQuestion[];
}
