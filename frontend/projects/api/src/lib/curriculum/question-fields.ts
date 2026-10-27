import type { QuestionType } from './question-type';

/** A question as the author writes it in the quiz-question dialog. */
export interface QuestionFields {
  text: string;
  type: QuestionType;
  options: string[];
  correct: number[];
  answers: string[];
}
