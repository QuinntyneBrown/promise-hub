import type { ProgressionStage } from './progression-stage';

/** The organization's progression framework, its stages in order (L2-086 criterion 1). */
export interface Progression {
  stages: ProgressionStage[];
}
