import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { AttendanceApi } from './attendance-api';
import { NewWalkIn } from './new-walk-in';
import { PickupOptions } from './pickup-options';
import { SignOut } from './sign-out';
import { SessionRoster } from './session-roster';
import { SessionSummary } from './session-summary';

@Injectable()
export class HttpAttendanceApi implements AttendanceApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  today(): Observable<LoadResult<{ sessions: SessionSummary[] }>> {
    return toLoad(this.http.get<{ sessions: SessionSummary[] }>(`${this.baseUrl}/sessions/today`));
  }

  roster(sessionId: string): Observable<LoadResult<SessionRoster>> {
    return toLoad(this.http.get<SessionRoster>(`${this.baseUrl}/sessions/${sessionId}/roster`));
  }

  checkIn(
    sessionId: string,
    childId: string,
    arrivedAt: string | null,
    clientActionId: string,
  ): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/sessions/${sessionId}/check-ins`, {
        childId,
        arrivedAt,
        clientActionId,
      }),
    );
  }

  markAbsent(sessionId: string, childId: string, clientActionId: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/sessions/${sessionId}/absences`, {
        childId,
        clientActionId,
      }),
    );
  }

  addWalkIn(sessionId: string, walkIn: NewWalkIn): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/sessions/${sessionId}/walk-ins`, walkIn),
    );
  }

  pickups(childId: string): Observable<LoadResult<PickupOptions>> {
    return toLoad(this.http.get<PickupOptions>(`${this.baseUrl}/children/${childId}/pickups`));
  }

  signOut(sessionId: string, signOut: SignOut): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/sessions/${sessionId}/sign-outs`, signOut),
    );
  }
}
