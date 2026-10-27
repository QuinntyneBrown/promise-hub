import type { EnrollmentApplicant } from './enrollment-applicant';
import type { EnrollmentReferrer } from './enrollment-referrer';

/**
 * What the person applying has entered: the household and the children to enroll. For a young person or a referral
 * (L2-071) the household is the young person's guardian and the children hold the one young person.
 */
export interface EnrollmentDraft {
  applyingAs?: EnrollmentApplicant;
  referrer?: EnrollmentReferrer | null;
  reason?: string | null;
  household: {
    guardianName: string | null;
    mobile: string | null;
    email: string | null;
    language: string | null;
  };
  children: EnrollmentChild[];
}

export interface EnrollmentChild {
  id: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  school: string | null;
  allergies: string | null;
  medication: string | null;
  enroll: boolean;
}
