import type { MentorActivity } from './mentor-activity';
import type { MentorCohortSummary } from './mentor-cohort-summary';
import type { MentoredYouth } from './mentored-youth';
import type { MentorFollowUp } from './mentor-follow-up';

/** The mentor dashboard (L2-063); attendance is null while Roll Call is off; follow-ups come from his mentor check-ins (L2-090). */
export interface MentorDashboard {
  youth: MentoredYouth[];
  cohorts: MentorCohortSummary[];
  checkedInThisWeek: number | null;
  recentActivity: MentorActivity[] | null;
  /** Soonest first. */
  followUps: MentorFollowUp[];
}
