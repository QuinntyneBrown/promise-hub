import type { ProgramSummary } from './program-summary';

export interface ProgramList {
  programs: ProgramSummary[];
  active: number;
  archived: number;
  enrolled: number;
}
