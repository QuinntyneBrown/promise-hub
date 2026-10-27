import type { ContentStatus } from './content-status';
import type { CurriculumModuleSummary } from './curriculum-module-summary';
import type { ProgramRef } from './program-ref';

/** One track of the curriculum with its modules in the order youth see. */
export interface CurriculumTrack {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: ContentStatus;
  modules: CurriculumModuleSummary[];
  /** The active programs that follow the track. */
  followedBy: ProgramRef[];
}
