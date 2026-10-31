import type { LearningBondCoverageMode } from './learning-bond-coverage-mode';
import type { LearningBondProgram } from './learning-bond-program';

/** GET /learning-bond/settings (L2-138): coverage, the roles that see status, and the running programs with their counts. */
export interface LearningBondSettings {
  coverage: LearningBondCoverageMode;
  programIds: string[];
  /** Role names, always starting with Admin and ProgramDirector. */
  statusRoles: string[];
  programs: LearningBondProgram[];
  /** The households every running program reaches together. */
  allHouseholds: number;
}
