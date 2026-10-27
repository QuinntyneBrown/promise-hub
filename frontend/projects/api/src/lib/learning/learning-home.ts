import type { NextLesson } from './next-lesson';
import type { TrackSummary } from './track-summary';

/** The Learning home (L2-068 criterion 1): progress, the lesson to continue with, and the youth's tracks. */
export interface LearningHome {
  completedLessons: number;
  totalLessons: number;
  next: NextLesson | null;
  tracks: TrackSummary[];
}
