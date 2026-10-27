import type { WriteOutcome } from '../write-outcome';

/** A badge awarded by hand (L2-085): a write, or refused because the youth already holds it or the badge is automatic. */
export type AwardOutcome = WriteOutcome | { status: 'already-awarded' } | { status: 'automatic' };
