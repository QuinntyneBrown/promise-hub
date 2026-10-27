import type { QuizAnswer } from '@promisehub/api';

/** The attempt being submitted, its answers and the numbers of the questions left blank. */
export interface SubmitQuizDialogData {
  attemptId: string;
  title: string;
  number: number;
  attemptsAllowed: number | null;
  total: number;
  answers: QuizAnswer[];
  position: number;
  blank: number[];
}
