/** One step of a submission's history (L2-078 criterion 1). */
export interface SubmissionHistoryItem {
  kind: 'Submitted' | 'ReviewStarted' | 'RevisionRequested' | 'Resubmitted' | 'Accepted';
  actor: string;
  note: string | null;
  at: string;
}
