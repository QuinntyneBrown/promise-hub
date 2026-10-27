import type { SessionAttendance } from './session-attendance';

/** Her attendance while Roll Call is on: sessions attended of sessions marked, newest first. */
export interface AttendanceSummary {
  attended: number;
  marked: number;
  sessions: SessionAttendance[];
}
