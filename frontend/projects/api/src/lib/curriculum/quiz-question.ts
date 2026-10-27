import type { QuestionType } from './question-type';

/** One question of a quiz with its correct answers, for authors only. */
export interface QuizQuestion {
  id: string;
  position: number;
  text: string;
  type: QuestionType;
  /** Options of choice types; True and False for true / false. */
  options: string[];
  /** Zero-based indexes of the correct options. */
  correct: number[];
  /** Accepted answers of a short-answer question. */
  answers: string[];
}
