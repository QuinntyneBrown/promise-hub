import type { QuestionType } from '../curriculum/question-type';

/** A question as a youth takes it: never its correct answers. */
export interface AttemptQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
}
