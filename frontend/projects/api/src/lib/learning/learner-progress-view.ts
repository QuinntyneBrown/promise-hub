import type { AttendanceSummary } from './attendance-summary';
import type { CompetencyLevelItem } from './competency-level-item';
import type { QuizHistoryItem } from './quiz-history-item';

/** A youth's own progress (L2-088); `attendance` is null while Roll Call is off and `quizAverage` with no scored quiz. */
export interface LearnerProgressView {
  completedLessons: number;
  totalLessons: number;
  streakWeeks: number;
  quizAverage: number | null;
  quizzes: QuizHistoryItem[];
  competencies: CompetencyLevelItem[];
  attendance: AttendanceSummary | null;
}
