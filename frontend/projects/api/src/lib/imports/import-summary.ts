import type { ImportRowIssue } from './import-row-issue';

export interface ImportSummary {
  fileName: string;
  rows: number;
  imported: number;
  familiesCreated: number;
  familiesUpdated: number;
  children: number;
  enrolled: number;
  skipped: number;
  needFix: number;
  toFix: ImportRowIssue[];
  programName: string | null;
  /** Youth invitations sent (L2-130). */
  invited: number;
  /** Rows whose cohort names no program of the organization. */
  notPlaced: ImportRowIssue[];
  /** Rows with a youth email that were not invited, and why. */
  notInvited: ImportRowIssue[];
}
