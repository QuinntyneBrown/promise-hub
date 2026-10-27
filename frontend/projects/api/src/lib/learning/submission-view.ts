/** A project submission as the youth sees it; review states arrive with mentor review. */
export interface SubmissionView {
  status: 'Submitted';
  submittedAt: string;
  note: string | null;
}
