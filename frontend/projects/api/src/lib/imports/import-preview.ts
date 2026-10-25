import type { ImportRowIssue } from './import-row-issue';

export interface ImportPreview {
  rows: number;
  duplicates: ImportRowIssue[];
  needLook: ImportRowIssue[];
  programName: string | null;
}
