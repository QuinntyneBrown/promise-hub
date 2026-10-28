import type { LessonKind } from './lesson-kind';

/**
 * Work a mentor assigned the youth that she has not done yet (L2-092 criterion 5): the kind and item, a lesson's kind (where it opens), its
 * module, the due date as yyyy-MM-dd, days left (negative once overdue), who assigned it and the message.
 */
export interface AssignedWorkItem {
  kind: 'Lesson' | 'Quiz' | 'Assignment';
  itemId: string;
  lessonKind: LessonKind | null;
  title: string;
  moduleTitle: string;
  dueOn: string;
  daysLeft: number;
  assignedBy: string;
  message: string | null;
}
