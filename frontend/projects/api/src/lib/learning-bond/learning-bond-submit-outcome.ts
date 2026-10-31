/**
 * What Submit answered (L2-149): sent (or already sent), not sent because the provider refused or didn't answer, stale because the review
 * changed since it was loaded, or incomplete.
 */
export type LearningBondSubmitOutcome =
  | { status: 'sent' }
  | { status: 'not-sent' }
  | { status: 'stale' }
  | { status: 'incomplete' }
  | { status: 'error' };
