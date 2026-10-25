/** A row by its line in the file (the header is line 1). */
export interface ImportRowIssue {
  row: number;
  child: string;
  reason: string;
}
