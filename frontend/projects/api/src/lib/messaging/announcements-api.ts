import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { AnnouncementList } from './announcement-list';
import type { ComposeAnnouncement } from './compose-announcement';

/** Announcements, part of the Messages module (L2-105, ADR 0068). */
export interface AnnouncementsApi {
  /** Staff with Send messages: every announcement of the organization with reach and reads. */
  list(): Observable<LoadResult<AnnouncementList>>;
  compose(request: ComposeAnnouncement): Observable<WriteOutcome>;
}
