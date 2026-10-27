import type { QuizQuestion } from '@promisehub/api';

/** The quiz a question is added to, or the question to edit with its number. */
export interface QuizQuestionDialogData {
  quizId: string;
  question?: QuizQuestion;
  number?: number;
}
