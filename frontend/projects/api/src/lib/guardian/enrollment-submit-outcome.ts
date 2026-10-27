import type { EnrollmentSubmitted } from './enrollment-submitted';

/** Submitting: recorded, invalid per field, refused because the young person already has an open application, or failed. */
export type EnrollmentSubmitOutcome =
  | { status: 'submitted'; value: EnrollmentSubmitted }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'duplicate'; name: string }
  | { status: 'error' };
