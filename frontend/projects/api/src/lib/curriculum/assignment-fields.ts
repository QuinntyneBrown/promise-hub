import type { RubricCriterion } from './rubric-criterion';
import type { SubmissionType } from './submission-type';

/** Everything the assignment builder saves at once, the whole rubric included. */
export interface AssignmentFields {
  title: string;
  /** Null for the whole module. */
  lessonId: string | null;
  brief: string;
  submissionTypes: SubmissionType[];
  rubric: RubricCriterion[];
  /** yyyy-mm-dd, or null. */
  dueDate: string | null;
  graceDays: number;
  allowLate: boolean;
  requireApproval: boolean;
}
