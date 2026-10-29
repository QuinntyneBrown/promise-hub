/** A detailed report to export as CSV (L2-129): Cohort and Progress name a program; Staff a period of 30 or 90 days, or all time. */
export interface ReportExportRequest {
  kind: 'Cohort' | 'Progress' | 'Staff';
  programId: string | null;
  days: 30 | 90 | null;
}
