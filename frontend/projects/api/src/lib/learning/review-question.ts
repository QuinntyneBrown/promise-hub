import type { QuestionType } from '../curriculum/question-type';

/** One question of a submitted attempt in review: her answer, the correct options or accepted answers, and whether she was right. */
export interface ReviewQuestion {
  questionId: string;
  number: number;
  text: string;
  type: QuestionType;
  options: string[];
  chosen: number[];
  answerText: string | null;
  correctOptions: number[];
  accepted: string[];
  right: boolean;
}
