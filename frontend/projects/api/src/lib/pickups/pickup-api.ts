import type { Observable } from 'rxjs';
import type { WriteOutcome } from '../write-outcome';
import type { LoadResult } from '../load-result';
import type { NewPickup } from './new-pickup';
import type { PickupRequest } from './pickup-request';

/** Staff add and remove the adults besides the guardians who may collect a child. */
export interface PickupApi {
  add(childId: string, pickup: NewPickup): Observable<WriteOutcome>;
  remove(childId: string, pickupId: string): Observable<WriteOutcome>;
  /** Texts the primary guardian about an adult not on the list; saved with the request id. */
  askGuardian(sessionId: string, childId: string, collectorName: string): Observable<WriteOutcome>;
  request(id: string): Observable<LoadResult<PickupRequest>>;
}
