/** A child's marked attendance and the rate of attended of marked. */
export interface YouthAttendanceSummary {
  present: number;
  late: number;
  excused: number;
  absent: number;
  rate: number | null;
}
