import type { SubmissionWork } from '@promisehub/api';

/** The work to send: to the assignment the first time, or to the submission when resubmitting after a revision. */
export interface SubmitAssignmentDialogData {
  assignmentId: string;
  submissionId: string | null;
  title: string;
  mentorName: string | null;
  /** "your reflection and 1 photo". */
  summary: string;
  work: SubmissionWork;
}
