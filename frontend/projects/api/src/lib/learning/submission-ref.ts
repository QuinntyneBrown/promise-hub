/** The youth's submission of an assignment, by id and status. */
export interface SubmissionRef {
  id: string;
  status: 'Submitted' | 'InReview' | 'NeedsRevision' | 'Accepted';
}
