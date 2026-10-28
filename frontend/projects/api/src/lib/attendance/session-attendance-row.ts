import type { SessionAttendanceStatus } from './session-attendance-status';

/** One session of a cohort's history: its marks, the rate (attended of marked, null when none) and its status. */
export interface SessionAttendanceRow {
  eventId: string;
  name: string;
  startsAt: string;
  present: number;
  late: number;
  excused: number;
  absent: number;
  rate: number | null;
  status: SessionAttendanceStatus;
}
