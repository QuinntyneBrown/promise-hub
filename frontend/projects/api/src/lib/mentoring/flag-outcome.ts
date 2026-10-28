import type { WriteOutcome } from '../write-outcome';

/** Raising or resolving an at-risk flag: a write's outcome, or the 409 codes already-flagged and already-resolved (L2-091). */
export type FlagOutcome =
  WriteOutcome | { status: 'already-flagged' } | { status: 'already-resolved' };
