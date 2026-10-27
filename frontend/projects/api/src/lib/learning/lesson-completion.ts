import type { LessonKind } from './lesson-kind';

/** After completing a lesson: the next lesson of the module, or that the module is done (L2-069 criterion 4). */
export interface LessonCompletion {
  nextLessonId: string | null;
  nextLessonTitle: string | null;
  nextLessonKind: LessonKind | null;
  moduleCompleted: boolean;
}
