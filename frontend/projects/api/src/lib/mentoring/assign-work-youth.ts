/** One of the mentor's youth to assign to (L2-092 criterion 1): the cohorts they are on, the tracks they follow, an open at-risk flag. */
export interface AssignWorkYouth {
  id: string;
  name: string;
  cohorts: string;
  trackIds: string[];
  atRisk: boolean;
}
