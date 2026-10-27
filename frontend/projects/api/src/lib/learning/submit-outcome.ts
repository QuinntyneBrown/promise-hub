/**
 * Sending or resending work (L2-077 criteria 3 to 5, L2-078 criteria 3 and 4): saved with the submission id, invalid with one message per
 * field, already submitted, closed, not revisable, locked, or why it failed.
 */
export type SubmitOutcome =
  | { status: 'saved'; id: string }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'submitted' }
  | { status: 'closed' }
  | { status: 'not-revisable' }
  | { status: 'locked' }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { status: 'error' };
