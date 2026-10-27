/** A quiz on a module page (L2-075 criterion 2): her status, best counted score and what to finish while locked. */
export interface QuizItem {
  id: string;
  title: string;
  lessonId: string | null;
  questionCount: number;
  required: boolean;
  status: 'locked' | 'next' | 'in-progress' | 'passed' | 'not-passed' | 'awaiting';
  bestScore: number | null;
  unlockAfter: string | null;
}
