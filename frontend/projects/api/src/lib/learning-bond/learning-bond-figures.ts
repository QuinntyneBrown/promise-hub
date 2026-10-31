import type { LearningBondDollars } from './learning-bond-dollars';

/** The six figures (L2-141): counts as numbers, "0" or "FewerThan5"; dollars null when suppressed. */
export interface LearningBondFigures {
  program: string | null;
  invited: string;
  started: string;
  completed: string;
  children: string;
  estimated: LearningBondDollars | null;
  confirmed: LearningBondDollars | null;
}
