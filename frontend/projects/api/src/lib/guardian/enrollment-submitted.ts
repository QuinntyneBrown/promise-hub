import type { EnrollmentApplicant } from './enrollment-applicant';

/** A recorded submission: waiting review or waitlisted, who applied and whether the season consent was given. */
export interface EnrollmentSubmitted {
  status: 'WaitingReview' | 'Waitlisted';
  position: number | null;
  children: number;
  appliedAs: EnrollmentApplicant;
  seasonConsent: boolean;
}
