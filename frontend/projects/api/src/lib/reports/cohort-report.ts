import type { CohortComparison } from './cohort-comparison';
import type { CohortLearning } from './cohort-learning';
import type { CohortYouth } from './cohort-youth';

/**
 * The cohort report of one program (L2-127). `learning` is null while Learning is off, `attendanceRate` while Roll Call is off or nothing is
 * marked, `atRisk` while Mentoring is off; the page renders only what is present.
 */
export interface CohortReport {
  programId: string;
  name: string;
  trackName: string | null;
  enrolled: number;
  ended: number;
  retentionRate: number | null;
  attendanceRate: number | null;
  learning: CohortLearning | null;
  atRisk: number | null;
  comparison: CohortComparison;
  youth: CohortYouth[];
}
