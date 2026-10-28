import type { WriteOutcome } from '../write-outcome';
import type { Rsvp } from './rsvp';

/** An RSVP: sent with what the server saved, closed because the session started or was cancelled (409), or why not (L2-094). */
export type RsvpOutcome =
  | { status: 'sent'; rsvp: Rsvp }
  | { status: 'closed' }
  | Exclude<WriteOutcome, { status: 'saved' }>;
