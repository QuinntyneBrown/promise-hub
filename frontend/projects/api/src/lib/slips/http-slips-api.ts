import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { Slip } from './slip';
import { SlipFields } from './slip-fields';
import { RemindOutcome } from './remind-outcome';
import { SlipClearance } from './slip-clearance';
import { SlipRow } from './slip-row';
import { UnsignedFamily } from './unsigned-family';
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

  clearance(sessionId: string): Observable<LoadResult<SlipClearance>> {
    return toLoad(this.http.get<SlipClearance>(`${this.baseUrl}/sessions/${sessionId}/clearance`));
  }

  unsigned(slipId: string): Observable<LoadResult<{ households: UnsignedFamily[] }>> {
    return toLoad(
      this.http.get<{ households: UnsignedFamily[] }>(`${this.baseUrl}/slips/${slipId}/unsigned`),
    );
  }

  remind(slipId: string, body: string): Observable<RemindOutcome> {
    return this.http
      .post<{ households: number; unreachable: number }>(`${this.baseUrl}/slips/${slipId}/remind`, {
        body,
      })
      .pipe(
        map((r): RemindOutcome => ({
          status: 'sent',
          households: r.households,
          unreachable: r.unreachable,
        })),
        catchError((error: HttpErrorResponse) =>
          of<RemindOutcome>(
            error.status === 422
              ? { status: 'invalid', errors: error.error?.errors ?? {} }
              : { status: 'error' },
          ),
        ),
      );
  }

  signOnTablet(
    slipId: string,
    householdId: string,
    name: string,
    photos: boolean | null,
  ): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/slips/${slipId}/sign-on-tablet`, {
        householdId,
        name,
        photos,
      }),
    );
  }
}
