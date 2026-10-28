import type { EventRsvp } from './event-rsvp';

/** A session's RSVPs: the counts (no reply is roster youth who sign in and have not answered) and each answer, newest first. */
export interface EventRsvps {
  going: number;
  maybe: number;
  cantMake: number;
  noReply: number;
  responses: EventRsvp[];
}
