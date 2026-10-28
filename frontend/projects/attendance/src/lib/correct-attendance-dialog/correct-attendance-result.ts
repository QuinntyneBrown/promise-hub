import type { AttendanceMarkName } from '@promisehub/api';

/** What was corrected, for the page's toast. */
export interface CorrectAttendanceResult {
  name: string;
  mark: AttendanceMarkName;
}
