import type { QueuedAttendance } from '../offline/queued-attendance';
import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { NewWalkIn } from './new-walk-in';
import type { PickupOptions } from './pickup-options';
import type { SignOut } from './sign-out';
import type { SessionRoster } from './session-roster';
import type { SessionSummary } from './session-summary';

export interface AttendanceApi {
  today(): Observable<LoadResult<{ sessions: SessionSummary[] }>>;
  roster(sessionId: string): Observable<LoadResult<SessionRoster>>;
  /** `arrivedAt` is null for now. The client action id makes a repeated tap harmless. */
  checkIn(
    sessionId: string,
    childId: string,
    arrivedAt: string | null,
    clientActionId: string,
  ): Observable<WriteOutcome>;
  markAbsent(sessionId: string, childId: string, clientActionId: string): Observable<WriteOutcome>;
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
  /** The Pickup module: a child's approved adults, and signing the child out. */
  pickups(childId: string): Observable<LoadResult<PickupOptions>>;
  signOut(sessionId: string, signOut: SignOut): Observable<WriteOutcome>;
}
