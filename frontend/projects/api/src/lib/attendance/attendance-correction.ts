import type { AttendanceMarkName } from './attendance-mark-name';

/** A correction an admin or program director makes after the fact, with why (L2-097). */
export interface AttendanceCorrection {
  status: AttendanceMarkName;
  reason: string;
}
