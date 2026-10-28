/** A session on a volunteer's own schedule (L2-101): when and where, the roster size, the event's status and whether it is today. */
export interface MySession {
  id: string;
  name: string;
  programName: string;
  /** The organization's calendar day, yyyy-mm-dd. */
  day: string;
  startsAt: string;
  endsAt: string;
  place: string | null;
  expected: number;
  status: 'Scheduled' | 'Cancelled' | 'Ended';
  today: boolean;
}
