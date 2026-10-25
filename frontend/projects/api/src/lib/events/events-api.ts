import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { EventDetail } from './event-detail';
import type { EventFields } from './event-fields';
import type { EventList } from './event-list';

export interface EventsApi {
  list(
    filter: 'upcoming' | 'needs-slips' | 'past',
    programId: string,
    q: string,
  ): Observable<LoadResult<EventList>>;
  get(id: string): Observable<LoadResult<EventDetail>>;
  create(fields: EventFields): Observable<WriteOutcome>;
  update(id: string, fields: EventFields): Observable<WriteOutcome>;
  cancel(id: string, message: string, tellGuardians: boolean): Observable<WriteOutcome>;
}
