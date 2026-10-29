import type { MentorActivityRow } from './mentor-activity-row';

/** The staff activity report (L2-128): totals and a row per mentor; reviews are null while Learning is off. */
export interface StaffReport {
  activeMentors: number;
  checkIns: number;
  reviews: number | null;
  averageCaseload: number;
  mentors: MentorActivityRow[];
}
