import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Billing } from './billing';
import type { PlanChange } from './plan-change';

/** Billing for admins. */
export interface BillingApi {
  load(): Observable<LoadResult<Billing>>;
  changePlan(plan: Billing['plan']): Observable<PlanChange>;
}
