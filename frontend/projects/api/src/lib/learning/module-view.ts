import type { LessonItem } from './lesson-item';

/** A module as a youth sees it (L2-068 criterion 4). */
export interface ModuleView {
  id: string;
  title: string;
  description: string | null;
  anchor: string | null;
  trackId: string;
  trackName: string;
  position: number;
  moduleCount: number;
  completedLessons: number;
  status: 'done' | 'in-progress' | 'not-started' | 'locked';
  lessons: LessonItem[];
}
