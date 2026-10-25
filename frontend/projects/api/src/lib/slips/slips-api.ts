import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { Slip } from './slip';
import type { SlipFields } from './slip-fields';
import type { RemindOutcome } from './remind-outcome';
import type { SlipClearance } from './slip-clearance';
import type { SlipRow } from './slip-row';
import type { UnsignedFamily } from './unsigned-family';

/** The Permission slips module: write, send or schedule, edit and track an event's slip. */
export interface SlipsApi {
  list(): Observable<LoadResult<{ slips: SlipRow[] }>>;
  forEvent(eventId: string): Observable<LoadResult<Slip>>;
  saveDraft(eventId: string, fields: SlipFields): Observable<WriteOutcome>;
  /** Now when `at` is null, scheduled otherwise. */
  send(slipId: string, at: string | null): Observable<WriteOutcome>;
  sendNow(slipId: string): Observable<WriteOutcome>;
  cancelSend(slipId: string): Observable<WriteOutcome>;
  /** An edit of a sent slip; a material one re-opens signing for everyone. */
  edit(
    slipId: string,
    change: { title: string; body: string; signBy: string; material: boolean },
  ): Observable<WriteOutcome>;
  /** Day of: who is cleared, missing or declined for a session whose event needs a slip. */
  clearance(sessionId: string): Observable<LoadResult<SlipClearance>>;
  unsigned(slipId: string): Observable<LoadResult<{ households: UnsignedFamily[] }>>;
  /** A staff-written reminder; {child} and {link} fill in per family. */
  remind(slipId: string, body: string): Observable<RemindOutcome>;
  /** A guardian at the door signs on the staff device for the family's unsigned children. */
  signOnTablet(
    slipId: string,
    householdId: string,
    name: string,
    photos: boolean | null,
  ): Observable<WriteOutcome>;
}
