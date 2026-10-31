import type { LearningBondTotalLine } from './learning-bond-total-line';

/** learning-bond-total (L2-158): unlocked so far, applied for, and the lines by child and stream. */
export interface LearningBondTotal {
  language: 'en' | 'es' | 'fr';
  organization: string;
  confirmed: number;
  estimated: number;
  nothingConfirmed: boolean;
  lines: LearningBondTotalLine[];
}
