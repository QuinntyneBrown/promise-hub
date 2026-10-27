/**
 * Saving or submitting an attempt's answers: saved (with the attempt id on submit), offline (no connection; nothing reached the
 * server), already submitted (409), invalid, or why it failed.
 */
export type AnswersOutcome =
  | { status: 'saved' }
  | { status: 'offline' }
  | { status: 'submitted' }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'not-found' }
  | { status: 'forbidden' }
  | { status: 'error' };
