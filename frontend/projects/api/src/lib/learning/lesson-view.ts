import type { LessonKind } from './lesson-kind';
import type { LessonRef } from './lesson-ref';

/** One lesson as a youth reads it (L2-069); never the leader guide notes. */
export interface LessonView {
  id: string;
  kind: LessonKind;
  title: string;
  reading: string | null;
  passage: string | null;
  minutes: number | null;
  objectives: string[];
  body: string | null;
  prompts: string[];
  moduleId: string;
  moduleTitle: string;
  trackId: string;
  trackName: string;
  position: number;
  lessonCount: number;
  hasVideo: boolean;
  done: boolean;
  next: LessonRef | null;
}
