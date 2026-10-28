import type { DirectMessage } from './direct-message';

/** A send: the message as saved, invalid with the field's message, blocked by a safeguard, or why it failed. */
export type SendOutcome =
  | { status: 'sent'; message: DirectMessage }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'blocked'; reason: string }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { status: 'error' };
