/** One session she was marked at. */
export interface SessionAttendance {
  eventId: string;
  name: string;
  startsAt: string;
  status: 'Present' | 'Absent';
}
