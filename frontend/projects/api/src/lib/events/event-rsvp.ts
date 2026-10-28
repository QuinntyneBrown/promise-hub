import type { RsvpResponse } from '../schedule/rsvp-response';

/** One youth's answer for a session, with her note for staff (L2-094 criterion 4). */
export interface EventRsvp {
  childId: string;
  childName: string;
  response: RsvpResponse;
  note: string | null;
  answeredAt: string;
}
