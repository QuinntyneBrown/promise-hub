import type { HouseholdSummary } from './household-summary';

export interface HouseholdList {
  households: HouseholdSummary[];
  counts: { all: number; missingInfo: number; spanish: number; french: number; children: number };
}
