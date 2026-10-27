import type { ContentStatus } from './content-status';

/** A module as listed in its track. */
export interface CurriculumModuleSummary {
  id: string;
  title: string;
  status: ContentStatus;
  lessonCount: number;
}
