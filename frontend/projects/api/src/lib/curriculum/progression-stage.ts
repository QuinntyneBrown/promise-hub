import type { ProgressionCompetency } from './progression-competency';

/** A stage of the progression framework with its competencies in order (L2-086). */
export interface ProgressionStage {
  id: string;
  position: number;
  name: string;
  description: string;
  competencies: ProgressionCompetency[];
}
