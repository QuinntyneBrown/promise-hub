import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { Rsvp } from './rsvp';
import { RsvpOutcome } from './rsvp-outcome';
import { ScheduleApi } from './schedule-api';
import { toRsvpOutcome } from './to-rsvp-outcome';
import { YouthSchedule } from './youth-schedule';

@Injectable()
export class HttpScheduleApi implements ScheduleApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  schedule(): Observable<LoadResult<YouthSchedule>> {
    return toLoad(this.http.get<YouthSchedule>(`${this.baseUrl}/schedule`));
  }

  rsvp(eventId: string, rsvp: Rsvp): Observable<RsvpOutcome> {
    return toRsvpOutcome(this.http.put<Rsvp>(`${this.baseUrl}/schedule/${eventId}/rsvp`, rsvp));
  }
}
