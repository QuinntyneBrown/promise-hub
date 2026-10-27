import type { CodingStep } from './coding-step';
import type { LessonKind } from './lesson-kind';
import type { LessonRef } from './lesson-ref';

/** A coding lesson or project as the youth works on it (L2-070). */
export interface CodingView {
  id: string;
  kind: LessonKind;
  title: string;
  body: string | null;
  minutes: number | null;
  moduleId: string;
  moduleTitle: string;
  position: number;
  lessonCount: number;
  steps: CodingStep[];
  code: string;
  checkedStepIds: string[];
  done: boolean;
  next: LessonRef | null;
}
