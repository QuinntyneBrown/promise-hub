/** A child waiting for review or waitlisted, with the family. */
export interface EnrollmentRequest {
  id: string;
  childId: string;
  householdId: string;
  child: string;
  age: number | null;
  guardian: string;
  phone: string | null;
  language: string;
  medical: string | null;
  returning: boolean;
  submittedAt: string;
  status: 'WaitingReview' | 'Waitlisted';
  position: number | null;
}
