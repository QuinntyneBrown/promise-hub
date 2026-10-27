import type { RubricLine } from './rubric-line';
import type { SubmissionRef } from './submission-ref';
import type { SubmissionType } from '../curriculum/submission-type';

/** An assignment as a youth reads it before submitting (L2-077 criterion 1). */
export interface AssignmentBrief {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  lessonTitle: string | null;
  brief: string;
  submissionTypes: SubmissionType[];
  rubric: RubricLine[];
  totalPoints: number;
  /** yyyy-mm-dd, or null without a due date. */
  dueDate: string | null;
  graceDays: number;
  allowLate: boolean;
  /** Open until the due date plus the grace days; then late when late work is accepted, otherwise closed. */
  dueState: 'open' | 'late' | 'closed';
  /** Days until the due date, negative once past it. */
  daysLeft: number | null;
  mentorName: string | null;
  submission: SubmissionRef | null;
}
