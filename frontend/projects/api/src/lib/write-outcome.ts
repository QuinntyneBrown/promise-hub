/** A write: saved (with the new id when one was created), invalid with one message per field, or why it failed. */
export type WriteOutcome =
  | { status: 'saved'; id?: string }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { status: 'error' };
