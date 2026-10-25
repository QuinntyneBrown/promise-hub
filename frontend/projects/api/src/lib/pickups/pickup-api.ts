import type { Observable } from 'rxjs';
import type { WriteOutcome } from '../write-outcome';
import type { NewPickup } from './new-pickup';

/** Staff add and remove the adults besides the guardians who may collect a child. */
export interface PickupApi {
  add(childId: string, pickup: NewPickup): Observable<WriteOutcome>;
  remove(childId: string, pickupId: string): Observable<WriteOutcome>;
}
