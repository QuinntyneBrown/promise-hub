import type { SubmissionDraft } from './submission-draft';

/** Drafts kept on this device per membership and assignment (L2-079 criteria 2 and 3, ADR 0056). */
export interface DraftStore {
  load(membershipId: string, assignmentId: string): SubmissionDraft | null;
  save(membershipId: string, assignmentId: string, draft: SubmissionDraft): void;
  clear(membershipId: string, assignmentId: string): void;
}
