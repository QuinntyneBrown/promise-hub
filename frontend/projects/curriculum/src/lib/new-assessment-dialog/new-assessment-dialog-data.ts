import type { LessonSummary } from '@promisehub/api';

/** The module a new quiz or assignment is added to, and its lessons to attach it to. */
export interface NewAssessmentDialogData {
  kind: 'quiz' | 'assignment';
  moduleId: string;
  moduleTitle: string;
  lessons: LessonSummary[];
}
