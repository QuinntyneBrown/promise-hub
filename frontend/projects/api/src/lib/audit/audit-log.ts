/** One page of the audit log, newest first. */
export interface AuditLog {
  entries: {
    when: string;
    who: string;
    action: string;
    record: string;
    summary: string;
    device: string | null;
  }[];
  total: number;
  page: number;
  pageSize: number;
}
