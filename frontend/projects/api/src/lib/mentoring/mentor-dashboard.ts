import type { MentorActivity } from './mentor-activity';
import type { MentorCohortSummary } from './mentor-cohort-summary';
import type { MentoredYouth } from './mentored-youth';
import type { MentorFollowUp } from './mentor-follow-up';
import type { MentorCheckInDue } from './mentor-check-in-due';

/** The mentor dashboard (L2-063); attendance is null while Roll Call is off; follow-ups come from his mentor check-ins (L2-090);
 * check-ins due follow the organization's cadence (L2-125). */
export interface MentorDashboard {
  youth: MentoredYouth[];
  cohorts: MentorCohortSummary[];
  checkedInThisWeek: number | null;
  recentActivity: MentorActivity[] | null;
  /** Soonest first. */
  followUps: MentorFollowUp[];
  /** How often the organization asks mentors to check in, in days (L2-125). */
  checkInEveryDays: number;
  /** Never-checked-in first, then the oldest. */
  checkInsDue: MentorCheckInDue[];
}
