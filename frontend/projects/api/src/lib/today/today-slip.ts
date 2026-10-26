/** A sent slip still collecting signatures. */
export interface TodaySlip {
  eventId: string;
  title: string;
  signBy: string;
  signed: number;
  expected: number;
  unsigned: number;
}
