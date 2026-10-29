import type { ImportRowIssue } from './import-row-issue';

export interface ImportPreview {
  rows: number;
  duplicates: ImportRowIssue[];
  needLook: ImportRowIssue[];
  programName: string | null;
  /** Rows a Cohort column places in an active program (L2-130). */
  placements: number;
  /** Rows a Youth email column invites (L2-130). */
  invitations: number;
}
