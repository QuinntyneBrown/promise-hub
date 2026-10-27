import type { Curriculum, CurriculumTrack } from '@promisehub/api';

/** The track whose cohorts are chosen, and the curriculum it belongs to (for the programs and the other tracks' names). */
export interface TrackCohortsDialogData {
  track: CurriculumTrack;
  curriculum: Curriculum;
}
