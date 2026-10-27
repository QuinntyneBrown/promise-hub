/** A quiz she has submitted: her best scored attempt and its pass, or waiting for her mentor with no score yet. */
export interface QuizHistoryItem {
  quizId: string;
  title: string;
  moduleTitle: string;
  bestScore: number | null;
  passed: boolean | null;
  waiting: boolean;
}
