import type { QueuedAttendance } from '../offline/queued-attendance';
import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { AttendanceHistory } from './attendance-history';
import type { NewWalkIn } from './new-walk-in';
import type { PickupOptions } from './pickup-options';
import type { SignOut } from './sign-out';
import type { SessionRoster } from './session-roster';
import type { SessionSummary } from './session-summary';

export interface AttendanceApi {
  today(): Observable<LoadResult<{ sessions: SessionSummary[] }>>;
  roster(sessionId: string): Observable<LoadResult<SessionRoster>>;
  /** `arrivedAt` is null for now; `late` marks a check-in after the start. The client action id makes a repeated tap harmless. */
  checkIn(
    sessionId: string,
    childId: string,
    arrivedAt: string | null,
    clientActionId: string,
    late?: boolean,
  ): Observable<WriteOutcome>;
  /** `excused` marks an absence the organization accepts. */
  markAbsent(
    sessionId: string,
    childId: string,
    clientActionId: string,
    excused?: boolean,
  ): Observable<WriteOutcome>;
  /** Check-ins and absences made without signal, in the order they will send. */
  queued(): QueuedAttendance[];
  /** Sends the queue in order and stops at the first network failure; emits how many were sent. */
  sync(): Observable<number>;
  endSession(
    sessionId: string,
    notCheckedIn: 'MarkAbsent' | 'LeaveNotRecorded',
    notSignedOut: 'SignOutAtEnd' | 'LeaveUnsigned',
  ): Observable<WriteOutcome>;
  saveNotes(sessionId: string, notes: string): Observable<WriteOutcome>;
  addWalkIn(sessionId: string, walkIn: NewWalkIn): Observable<WriteOutcome>;
  /** A cohort's attendance by session and by youth (L2-097); with no program, the first the caller may choose. */
  history(programId?: string | null): Observable<LoadResult<AttendanceHistory>>;
  /** The Pickup module: a child's approved adults, and signing the child out. */
  pickups(childId: string): Observable<LoadResult<PickupOptions>>;
  signOut(sessionId: string, signOut: SignOut): Observable<WriteOutcome>;
}
