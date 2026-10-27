import type { ContentStatus } from './content-status';
import type { LessonSummary } from './lesson-summary';
import type { ModuleRef } from './module-ref';

/** One module for the module editor. */
export interface ModuleDetail {
  id: string;
  trackId: string;
  trackName: string;
  title: string;
  description: string | null;
  prerequisiteModuleId: string | null;
  anchor: string | null;
  status: ContentStatus;
  position: number;
  moduleCount: number;
  earlierModules: ModuleRef[];
  lessons: LessonSummary[];
  /** The names of the active programs that follow the module's track. */
  programs: string[];
}
