import type { ContentStatus } from './content-status';

/** A lesson as listed in its module. */
export interface LessonSummary {
  id: string;
  title: string;
  minutes: number | null;
  status: ContentStatus;
}
