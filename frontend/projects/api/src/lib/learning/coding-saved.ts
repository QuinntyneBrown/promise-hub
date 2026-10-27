import type { LessonKind } from './lesson-kind';

/** After saving coding progress (L2-070 criterion 3). */
export interface CodingSaved {
  checked: number;
  total: number;
  done: boolean;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
  nextLessonKind: LessonKind | null;
  moduleCompleted: boolean;
}
