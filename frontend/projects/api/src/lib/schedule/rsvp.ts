import type { RsvpResponse } from './rsvp-response';

/** What a youth sends, and what the server answers once saved. */
export interface Rsvp {
  response: RsvpResponse;
  note: string | null;
}
