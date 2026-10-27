/** A youth's answer to one question: the zero-based options she chose, or her short-answer text. */
export interface QuizAnswer {
  questionId: string;
  choices: number[] | null;
  text: string | null;
}
