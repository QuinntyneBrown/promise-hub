import type { LearningBondFamilyStatus } from './learning-bond-family-status';

/** A covered household as staff see it (L2-142 criterion 1): nothing about the claim beyond its status. */
export interface LearningBondFamily {
  householdId: string;
  name: string;
  guardian: string | null;
  /** The covered programs, comma-separated. */
  programs: string;
  status: LearningBondFamilyStatus;
  /** ISO 8601: the last change, or null before any. */
  changedAt: string | null;
  /** While a call is requested: the number and "Mornings", "Afternoons" or "Evenings" the guardian gave. */
  callPhone?: string | null;
  callWhen?: string | null;
}
