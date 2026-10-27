import type { ContentStatus } from './content-status';
import type { LessonVideo } from './lesson-video';

/** One lesson for the lesson editor, leader notes included (authors only). */
export interface LessonDetail {
  id: string;
  moduleId: string;
  moduleTitle: string;
  trackId: string;
  trackName: string;
  title: string;
  reading: string | null;
  minutes: number | null;
  objectives: string[];
  body: string | null;
  prompts: string[];
  leaderNotes: string | null;
  status: ContentStatus;
  position: number;
  lessonCount: number;
  video: LessonVideo | null;
  /** The names of the active programs that follow the lesson's track. */
  programs: string[];
}
