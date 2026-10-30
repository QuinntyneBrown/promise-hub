/** POST /learning-bond/exports (L2-143): the funder CSV, kept 7 days. */
export interface LearningBondExportCreated {
  id: string;
  fileName: string;
  rows: number;
  expiresAt: string;
}
