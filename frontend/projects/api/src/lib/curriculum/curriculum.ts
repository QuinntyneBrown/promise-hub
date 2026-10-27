import type { CurriculumProgram } from './curriculum-program';
import type { CurriculumTrack } from './curriculum-track';

/** The tracks authors have written (L2-066). */
export interface Curriculum {
  tracks: CurriculumTrack[];
  /** The organization's active programs and the track each follows. */
  programs: CurriculumProgram[];
}
