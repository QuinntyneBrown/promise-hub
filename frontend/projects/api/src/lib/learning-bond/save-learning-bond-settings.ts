import type { LearningBondCoverageMode } from './learning-bond-coverage-mode';

/** PUT /learning-bond/settings: coverage, the chosen programs and the roles that see status. */
export interface SaveLearningBondSettings {
  coverage: LearningBondCoverageMode;
  programIds: string[];
  statusRoles: string[];
}
