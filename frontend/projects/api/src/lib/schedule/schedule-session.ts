import type { RsvpResponse } from './rsvp-response';

/** A session on a youth's schedule: the organization's calendar day (yyyy-mm-dd), its status and her answer and note. */
export interface ScheduleSession {
  eventId: string;
  name: string;
  programName: string;
  day: string;
  startsAt: string;
  endsAt: string;
  place: string | null;
  status: 'Scheduled' | 'Cancelled' | 'Ended';
  response: RsvpResponse | null;
  note: string | null;
}
