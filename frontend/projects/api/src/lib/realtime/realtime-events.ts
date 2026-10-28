import type { Observable } from 'rxjs';
import type { RealtimeEvent } from './realtime-event';

/** The signed-in member's event stream (L2-107, ADR 0068); a page subscribes while it is open. */
export interface RealtimeEvents {
  events(): Observable<RealtimeEvent>;
}
