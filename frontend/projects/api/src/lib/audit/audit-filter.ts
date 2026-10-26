/** Text matched against who, the record and the summary; an action; the last N days. */
export interface AuditFilter {
  q: string;
  action: string;
  days: number;
  page: number;
}
