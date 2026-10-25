import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { Slip } from './slip';
import type { SlipFields } from './slip-fields';
import type { SlipRow } from './slip-row';

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
}
