import type { CohortOption } from './cohort-option';
import type { SessionAttendanceRow } from './session-attendance-row';
import type { YouthAttendanceRow } from './youth-attendance-row';

/** A cohort's attendance history and rates (L2-097); `programId` is null when the caller has no cohort to choose. */
export interface AttendanceHistory {
  cohorts: CohortOption[];
  programId: string | null;
  programName: string | null;
  schedule: string | null;
  rate: number | null;
  sessionsRecorded: number;
  sessionsHeld: number;
  belowThreshold: number;
  canCorrect: boolean;
  sessions: SessionAttendanceRow[];
  youth: YouthAttendanceRow[];
}
