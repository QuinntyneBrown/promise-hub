import type { AttemptQuestion } from './attempt-question';
import type { QuizAnswer } from './quiz-answer';

/** An attempt in progress: its questions in order, her saved answers and the question she was on (L2-075 criteria 3 and 4). */
export interface QuizAttemptView {
  attemptId: string;
  quizId: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  number: number;
  attemptsAllowed: number | null;
  position: number;
  questions: AttemptQuestion[];
  answers: QuizAnswer[];
}
