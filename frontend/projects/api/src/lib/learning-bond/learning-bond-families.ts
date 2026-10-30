import type { LearningBondFamily } from './learning-bond-family';
import type { LearningBondProgram } from './learning-bond-program';

/** GET /learning-bond/households: how many are covered, the covered programs to filter by, and the rows that match. */
export interface LearningBondFamilies {
  covered: number;
  programs: LearningBondProgram[];
  households: LearningBondFamily[];
}
