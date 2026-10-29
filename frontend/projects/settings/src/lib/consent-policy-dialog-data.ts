import type { ConsentPolicy, WriteOutcome } from '@promisehub/api';
import type { Observable } from 'rxjs';

/** What opens the consent-policy dialog: the policy as it stands and where to save it (Privacy and data, or Learning on Organization). */
export interface ConsentPolicyDialogData {
  policy: ConsentPolicy;
  save: (policy: ConsentPolicy) => Observable<WriteOutcome>;
}
