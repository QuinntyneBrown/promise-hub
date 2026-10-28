import type { AssignWorkCohort } from './assign-work-cohort';
import type { AssignWorkItem } from './assign-work-item';
import type { AssignWorkYouth } from './assign-work-youth';

/** What the mentor may assign and to whom (L2-092 criterion 1). */
export interface AssignWorkOptions {
  items: AssignWorkItem[];
  youth: AssignWorkYouth[];
  cohorts: AssignWorkCohort[];
}
