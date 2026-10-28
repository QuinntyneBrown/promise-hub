/** An event on the calendar (L2-093): its organization calendar day (yyyy-mm-dd) decides where it shows. */
export interface CalendarEvent {
  id: string;
  name: string;
  programId: string;
  programName: string;
  day: string;
  startsAt: string;
  endsAt: string;
  place: string | null;
  status: 'Scheduled' | 'Cancelled' | 'Ended';
}
