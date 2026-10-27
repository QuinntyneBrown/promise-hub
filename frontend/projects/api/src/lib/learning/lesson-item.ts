import type { LessonKind } from './lesson-kind';

/** A lesson in a module; `unlockAfter` names what to finish first while locked. */
export interface LessonItem {
  id: string;
  title: string;
  kind: LessonKind;
  reading: string | null;
  minutes: number | null;
  status: 'done' | 'next' | 'locked';
  unlockAfter: string | null;
}
