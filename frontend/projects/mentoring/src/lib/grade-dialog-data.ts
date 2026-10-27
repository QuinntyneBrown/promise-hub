import type { GradeRequest } from '@promisehub/api';

/** What the approve and revision dialogs send: the submission, the grade so far, and words for the youth and assignment. */
export interface GradeDialogData {
  submissionId: string;
  request: GradeRequest;
  youthFirstName: string;
  assignmentTitle: string;
  total: number;
  totalPoints: number;
}
