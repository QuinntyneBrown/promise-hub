import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, concatMap, from, map, of, reduce, takeWhile, tap } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { OfflineStore } from '../offline/offline-store';
import { QueuedAttendance } from '../offline/queued-attendance';
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
  private readonly store = inject(OfflineStore);

  today(): Observable<LoadResult<{ sessions: SessionSummary[] }>> {
    return this.cached(
      'today',
      this.http.get<{ sessions: SessionSummary[] }>(`${this.baseUrl}/sessions/today`),
      (v) => v,
    );
  }

  roster(sessionId: string): Observable<LoadResult<SessionRoster>> {
    return this.cached(
      `roster.${sessionId}`,
      this.http.get<SessionRoster>(`${this.baseUrl}/sessions/${sessionId}/roster`),
      (v, savedAt) => ({ ...v, savedAt }),
    );
  }

  queued(): QueuedAttendance[] {
    return this.store.queue();
  }

  sync(): Observable<number> {
    return from(this.store.queue()).pipe(
      concatMap((a) => this.send(a).pipe(map((outcome) => ({ a, outcome })))),
      takeWhile(({ outcome }) => outcome.status !== 'queued'),
      tap(({ a }) => this.store.remove(a.clientActionId)),
      reduce((count) => count + 1, 0),
    );
  }

  /** Saves each loaded value on the device; with no signal, answers the saved one (marked with when it was saved) or offline. */
  private cached<T>(
    key: string,
    call: Observable<T>,
    saved: (value: T, savedAt: string) => T,
  ): Observable<LoadResult<T>> {
    return call.pipe(
      tap((value) => this.store.save(key, value)),
      map((value): LoadResult<T> => ({ status: 'loaded', value })),
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 0) return toLoad<T>(new Observable((o) => o.error(error)));
        const kept = this.store.read<T>(key);
        return of<LoadResult<T>>(
          kept
            ? { status: 'loaded', value: saved(kept.value, kept.savedAt) }
            : { status: 'offline' },
        );
      }),
    );
  }

  private send(a: QueuedAttendance): Observable<WriteOutcome> {
    const body =
      a.kind === 'check-in'
        ? { childId: a.childId, arrivedAt: a.at, clientActionId: a.clientActionId }
        : { childId: a.childId, clientActionId: a.clientActionId };
    const path = a.kind === 'check-in' ? 'check-ins' : 'absences';
    return this.offlineAware(
      this.http.post<null>(`${this.baseUrl}/sessions/${a.sessionId}/${path}`, body),
      null,
    );
  }

  /** A write that fails for lack of signal is queued on the device (when given an action) instead of failing. */
  private offlineAware(
    call: Observable<null>,
    action: QueuedAttendance | null,
  ): Observable<WriteOutcome> {
    return call.pipe(
      map((): WriteOutcome => ({ status: 'saved' })),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          if (action) this.store.enqueue(action);
          return of<WriteOutcome>({ status: 'queued' });
        }
        return toWrite(new Observable<null>((o) => o.error(error)));
      }),
    );
  }

  checkIn(
    sessionId: string,
    childId: string,
    arrivedAt: string | null,
    clientActionId: string,
  ): Observable<WriteOutcome> {
    return this.offlineAware(
      this.http.post<null>(`${this.baseUrl}/sessions/${sessionId}/check-ins`, {
        childId,
        arrivedAt,
        clientActionId,
      }),
      {
        clientActionId,
        sessionId,
        childId,
        childName: '',
        kind: 'check-in',
        at: arrivedAt ?? new Date().toISOString(),
      },
    );
  }

  endSession(
    sessionId: string,
    notCheckedIn: 'MarkAbsent' | 'LeaveNotRecorded',
    notSignedOut: 'SignOutAtEnd' | 'LeaveUnsigned',
  ): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/sessions/${sessionId}/end`, {
        notCheckedIn,
        notSignedOut,
      }),
    );
  }

  saveNotes(sessionId: string, notes: string): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/sessions/${sessionId}/notes`, { notes }));
  }

  markAbsent(sessionId: string, childId: string, clientActionId: string): Observable<WriteOutcome> {
    return this.offlineAware(
      this.http.post<null>(`${this.baseUrl}/sessions/${sessionId}/absences`, {
        childId,
        clientActionId,
      }),
      {
        clientActionId,
        sessionId,
        childId,
        childName: '',
        kind: 'absent',
        at: new Date().toISOString(),
      },
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
