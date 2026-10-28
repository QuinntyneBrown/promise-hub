import type { AssignedWorkItem } from '@promisehub/api';
import { formatDay } from '@promisehub/components';
import { lessonLink } from './lesson-link';

/** When it is due, in a few words (L2-092 criterion 5): Overdue, Due today, Due tomorrow or Due in n days. */
export function dueLabel(a: AssignedWorkItem): string {
  if (a.daysLeft < 0) return 'Overdue';
  if (a.daysLeft === 0) return 'Due today';
  if (a.daysLeft === 1) return 'Due tomorrow';
  return `Due in ${a.daysLeft} days`;
}

export function dueTone(a: AssignedWorkItem): 'info' | 'warning' | 'danger' {
  return a.daysLeft < 0 ? 'danger' : a.daysLeft === 0 ? 'warning' : 'info';
}

/** "Lesson · Leading by Serving · Due Fri 13 Nov · From Daniel Osei"; past the date, "Was due". */
export function assignedMeta(a: AssignedWorkItem): string {
  return `${a.kind} · ${a.moduleTitle} · ${a.daysLeft < 0 ? 'Was due' : 'Due'} ${formatDay(a.dueOn)} · From ${a.assignedBy}`;
}

/** Where the work opens: the lesson (or coding page), the quiz or the assignment. */
export function assignedLink(a: AssignedWorkItem): string[] {
  if (a.kind === 'Quiz') return ['/learning/quizzes', a.itemId];
  if (a.kind === 'Assignment') return ['/learning/assignments', a.itemId];
  return lessonLink(a.lessonKind ?? 'Reading', a.itemId);
}
