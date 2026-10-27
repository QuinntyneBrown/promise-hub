import type { LessonItem } from './lesson-item';
import type { QuizItem } from './quiz-item';
import type { AssignmentItem } from './assignment-item';

/** A module as a youth sees it (L2-068 criterion 4) with its quizzes (L2-075 criterion 2) and assignments (L2-077 criterion 1). */
export interface ModuleView {
  id: string;
  title: string;
  description: string | null;
  anchor: string | null;
  trackId: string;
  trackName: string;
  position: number;
  moduleCount: number;
  completedLessons: number;
  status: 'done' | 'in-progress' | 'not-started' | 'locked';
  lessons: LessonItem[];
  quizzes: QuizItem[];
  assignments: AssignmentItem[];
}
