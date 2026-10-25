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
}
