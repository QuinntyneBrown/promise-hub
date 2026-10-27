import type { LessonKind } from './lesson-kind';

/** A lesson named as the next one. */
export interface LessonRef {
  id: string;
  title: string;
  kind: LessonKind;
}
