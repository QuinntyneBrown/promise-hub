import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Rsvp } from './rsvp';
import type { RsvpOutcome } from './rsvp-outcome';
import type { YouthSchedule } from './youth-schedule';

/** A youth's schedule and RSVPs (L2-094, ADR 0064). */
export interface ScheduleApi {
  schedule(): Observable<LoadResult<YouthSchedule>>;
  rsvp(eventId: string, rsvp: Rsvp): Observable<RsvpOutcome>;
}
