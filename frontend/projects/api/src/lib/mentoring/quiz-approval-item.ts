/** A quiz attempt waiting for the mentor's approval with its auto-score (L2-081 criterion 1). */
export interface QuizApprovalItem {
  id: string;
  youthName: string;
  quizTitle: string;
  moduleTitle: string;
  number: number;
  score: number;
  correct: number;
  total: number;
  passMark: number;
  submittedAt: string;
}
