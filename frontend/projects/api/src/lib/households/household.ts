import type { ChildSummary } from './child-summary';
import type { Guardian } from './guardian';

export interface Household {
  id: string;
  name: string;
  language: string;
  guardians: Guardian[];
  children: ChildSummary[];
  medicalRestricted: boolean;
}
