import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { AudienceRequest } from './audience-request';
import type { MessageDetail } from './message-detail';
import type { MessageList } from './message-list';
import type { MessagePreview } from './message-preview';
import type { SmsCap } from './sms-cap';

/** The Messages module: compose, send and track guardian messages within the SMS cap. */
export interface MessagingApi {
  list(): Observable<LoadResult<MessageList>>;
  preview(request: AudienceRequest): Observable<LoadResult<MessagePreview>>;
  /** Saved with the new message's id; the server sends it in the background. */
  send(request: AudienceRequest): Observable<WriteOutcome>;
  get(id: string): Observable<LoadResult<MessageDetail>>;
  smsCap(): Observable<LoadResult<SmsCap>>;
}
