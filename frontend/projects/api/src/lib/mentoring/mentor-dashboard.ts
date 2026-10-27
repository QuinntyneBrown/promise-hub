import type { MentorActivity } from './mentor-activity';
import type { MentorCohortSummary } from './mentor-cohort-summary';
import type { MentoredYouth } from './mentored-youth';

/** The mentor dashboard (L2-063); attendance is null while Roll Call is off. */
export interface MentorDashboard {
  youth: MentoredYouth[];
  cohorts: MentorCohortSummary[];
  checkedInThisWeek: number | null;
  recentActivity: MentorActivity[] | null;
}
