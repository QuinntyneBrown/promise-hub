import type { LessonKind } from './lesson-kind';

/** The lesson to continue with. */
export interface NextLesson {
  lessonId: string;
  kind: LessonKind;
  title: string;
  moduleId: string;
  moduleTitle: string;
  reading: string | null;
  minutes: number | null;
  moduleCompleted: number;
  moduleTotal: number;
}
