import type { ContentStatus } from './content-status';
import type { LessonOption } from './lesson-option';
import type { RubricCriterion } from './rubric-criterion';
import type { SubmissionType } from './submission-type';

/** One assignment for the assignment builder. */
export interface AssignmentDetail {
  id: string;
  moduleId: string;
  moduleTitle: string;
  trackId: string;
  trackName: string;
  title: string;
  lessonId: string | null;
  status: ContentStatus;
  brief: string | null;
  submissionTypes: SubmissionType[];
  rubric: RubricCriterion[];
  totalPoints: number;
  dueDate: string | null;
  graceDays: number;
  allowLate: boolean;
  requireApproval: boolean;
  lessons: LessonOption[];
  programs: string[];
}
