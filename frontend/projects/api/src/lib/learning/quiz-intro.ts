import type { FeedbackMode } from '../curriculum/feedback-mode';
import type { InProgressAttempt } from './in-progress-attempt';

/** A quiz's rules and where the youth stands with it (L2-075 criterion 1); `attemptsAllowed` is null for unlimited. */
export interface QuizIntro {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  lessonTitle: string | null;
  questionCount: number;
  passMark: number;
  attemptsAllowed: number | null;
  feedback: FeedbackMode;
  attemptsUsed: number;
  attemptNumber: number;
  inProgress: InProgressAttempt | null;
  bestScore: number | null;
  passed: boolean;
  bestAttemptId: string | null;
  lastAttemptId: string | null;
  awaiting: boolean;
  canStart: boolean;
}
