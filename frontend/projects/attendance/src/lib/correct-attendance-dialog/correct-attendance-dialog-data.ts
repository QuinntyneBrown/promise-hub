import type { SessionAttendanceRow } from '@promisehub/api';

/** The session to correct and the cohort it belongs to. */
export interface CorrectAttendanceDialogData {
  session: SessionAttendanceRow;
  programName: string;
}
