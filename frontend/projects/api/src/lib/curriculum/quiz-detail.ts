import type { ContentStatus } from './content-status';
import type { FeedbackMode } from './feedback-mode';
import type { LessonOption } from './lesson-option';
import type { QuizQuestion } from './quiz-question';

/** One quiz for the quiz builder. */
export interface QuizDetail {
  id: string;
  moduleId: string;
  moduleTitle: string;
  trackId: string;
  trackName: string;
  title: string;
  /** Null for the whole module. */
  lessonId: string | null;
  status: ContentStatus;
  passMark: number;
  /** Null for unlimited. */
  attemptsAllowed: number | null;
  feedback: FeedbackMode;
  shuffle: boolean;
  requiredToComplete: boolean;
  questions: QuizQuestion[];
  lessons: LessonOption[];
  /** The names of the active programs that follow the track. */
  programs: string[];
}
