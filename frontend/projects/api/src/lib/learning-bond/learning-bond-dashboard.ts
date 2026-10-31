import type { LearningBondFigures } from './learning-bond-figures';
import type { LearningBondProgram } from './learning-bond-program';

/** GET /learning-bond/dashboard (L2-141): the covered programs, the period, the organization's figures and a row per program. */
export interface LearningBondDashboard {
  programs: LearningBondProgram[];
  period: '30' | '90' | 'all';
  program: string | null;
  all: LearningBondFigures;
  rows: LearningBondFigures[];
  empty: boolean;
}
