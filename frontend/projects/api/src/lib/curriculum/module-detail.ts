import type { AssignmentSummary } from './assignment-summary';
import type { ContentStatus } from './content-status';
import type { LessonSummary } from './lesson-summary';
import type { ModuleRef } from './module-ref';
import type { QuizSummary } from './quiz-summary';

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
  /** The module's quizzes, by title. */
  quizzes: QuizSummary[];
  /** The module's assignments, by title. */
  assignments: AssignmentSummary[];
}
