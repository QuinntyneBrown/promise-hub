import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { Slip } from './slip';
import { SlipFields } from './slip-fields';
import { SlipRow } from './slip-row';
import { SlipsApi } from './slips-api';

@Injectable()
export class HttpSlipsApi implements SlipsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<LoadResult<{ slips: SlipRow[] }>> {
    return toLoad(this.http.get<{ slips: SlipRow[] }>(`${this.baseUrl}/slips`));
  }

  forEvent(eventId: string): Observable<LoadResult<Slip>> {
    return toLoad(this.http.get<Slip>(`${this.baseUrl}/events/${eventId}/slip`));
  }

  saveDraft(eventId: string, fields: SlipFields): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/events/${eventId}/slip`, fields));
  }

  send(slipId: string, at: string | null): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/slips/${slipId}/send`, { at }));
  }

  sendNow(slipId: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/slips/${slipId}/send-now`, {}));
  }

  cancelSend(slipId: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/slips/${slipId}/cancel-send`, {}));
  }

  edit(
    slipId: string,
    change: { title: string; body: string; signBy: string; material: boolean },
  ): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/slips/${slipId}`, change));
  }
}
