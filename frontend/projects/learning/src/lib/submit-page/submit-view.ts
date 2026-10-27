import type { AssignmentBrief, AssignmentSubmissionView } from '@promisehub/api';

/** The assignment being submitted and, when revising, the submission sent back. */
export interface SubmitView {
  brief: AssignmentBrief;
  revising: AssignmentSubmissionView | null;
}
