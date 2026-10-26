/** A written export and when its link stops working. */
export interface ReportExport {
  id: string;
  fileName: string;
  rows: number;
  expiresAt: string;
}
