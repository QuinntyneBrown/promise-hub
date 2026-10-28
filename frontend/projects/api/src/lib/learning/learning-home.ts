import type { AssignedWorkItem } from './assigned-work-item';
import type { NextLesson } from './next-lesson';
import type { TrackSummary } from './track-summary';

/**
 * The Learning home (L2-068 criterion 1): progress, the lesson to continue with, and the youth's tracks; and, while Mentoring is on, the work
 * assigned to her that she has not done, soonest due first (L2-092 criterion 5).
 */
export interface LearningHome {
  completedLessons: number;
  totalLessons: number;
  next: NextLesson | null;
  tracks: TrackSummary[];
  assigned: AssignedWorkItem[];
}
