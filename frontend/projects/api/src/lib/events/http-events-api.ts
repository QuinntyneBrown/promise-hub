import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { EventDetail } from './event-detail';
import { EventFields } from './event-fields';
import { EventList } from './event-list';
import { EventsApi } from './events-api';

@Injectable()
export class HttpEventsApi implements EventsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(
    filter: 'upcoming' | 'needs-slips' | 'past',
    programId: string,
    q: string,
  ): Observable<LoadResult<EventList>> {
    let params = new HttpParams().set('filter', filter);
    if (programId) params = params.set('programId', programId);
    if (q) params = params.set('q', q);
    return toLoad(this.http.get<EventList>(`${this.baseUrl}/events`, { params }));
  }

  get(id: string): Observable<LoadResult<EventDetail>> {
    return toLoad(this.http.get<EventDetail>(`${this.baseUrl}/events/${id}`));
  }

  create(fields: EventFields): Observable<WriteOutcome> {
    return toWrite(this.http.post<{ id: string; count: number }>(`${this.baseUrl}/events`, fields));
  }

  update(id: string, fields: EventFields): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/events/${id}`, fields));
  }

  cancel(id: string, message: string, tellGuardians: boolean): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/events/${id}/cancel`, { message, tellGuardians }),
    );
  }
}
