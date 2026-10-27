import type { ApplicationStatus } from './application-status';

/** One application in the pipeline: the young person, who applied, the program and the decision so far. */
export interface ApplicationSummary {
  id: string;
  childId: string;
  child: string;
  age: number | null;
  appliedAs: 'Guardian' | 'Youth' | 'Referrer';
  appliedBy: string;
  referrerRole: string | null;
  programId: string;
  program: string;
  submittedAt: string;
  status: ApplicationStatus;
  position: number | null;
  seasonConsent: boolean;
  returning: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  note: string | null;
}
