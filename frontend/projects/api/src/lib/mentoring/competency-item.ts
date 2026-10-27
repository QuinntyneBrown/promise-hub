import type { CompetencyLevel } from './competency-level';

/** One competency with the youth's latest level and note, who set it and when (L2-082 criterion 1). */
export interface CompetencyItem {
  id: string;
  name: string;
  description: string;
  level: CompetencyLevel;
  notes: string | null;
  assessedBy: string | null;
  assessedAt: string | null;
}
