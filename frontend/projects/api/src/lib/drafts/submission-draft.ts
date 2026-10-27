/** A youth's unsent reflection and link for one assignment, kept on this device (L2-079, ADR 0056); never a file. */
export interface SubmissionDraft {
  text: string;
  link: string;
  /** ISO time the draft was saved. */
  savedAt: string;
}
