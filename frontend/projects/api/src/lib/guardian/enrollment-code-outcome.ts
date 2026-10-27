import type { WriteOutcome } from '../write-outcome';

/** Asking for a code: as any write, or refused because three were sent in the last 15 minutes (L2-071). */
export type EnrollmentCodeOutcome = WriteOutcome | { status: 'too-many' };
