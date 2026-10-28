/** One youth on a cohort's roster: sessions attended (present or late) of marked, and below 70% when marked at least once. */
export interface YouthAttendanceRow {
  childId: string;
  name: string;
  attended: number;
  marked: number;
  late: number;
  excused: number;
  absent: number;
  rate: number | null;
  belowThreshold: boolean;
}
