import type { CompetencyItem } from './competency-item';

/** A youth's competencies and how many are Proficient or Mastered (L2-082 criterion 1). */
export interface CompetencySheet {
  childId: string;
  name: string;
  items: CompetencyItem[];
  proficientOrMastered: number;
  total: number;
}
