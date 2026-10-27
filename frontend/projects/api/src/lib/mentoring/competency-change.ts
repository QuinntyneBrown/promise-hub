import type { CompetencyLevel } from './competency-level';

/** One competency's level and note as the page saves it. */
export interface CompetencyChange {
  competencyId: string;
  level: CompetencyLevel;
  notes: string | null;
}
