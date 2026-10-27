import type { ApplicationGuardian } from './application-guardian';
import type { ApplicationNote } from './application-note';
import type { ApplicationReferrer } from './application-referrer';
import type { ApplicationSummary } from './application-summary';

/** One application: the young person, who applied and why, the family, the decision and the staff notes. */
export interface Application extends ApplicationSummary {
  firstName: string;
  dateOfBirth: string | null;
  householdId: string;
  household: string;
  guardian: ApplicationGuardian | null;
  reason: string | null;
  referrer: ApplicationReferrer | null;
  notes: ApplicationNote[];
}
