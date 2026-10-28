import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Conversation } from './conversation';
import type { ConversationList } from './conversation-list';
import type { SendOutcome } from './send-outcome';

/** Direct messages between a mentor and a youth, part of the Messages module (L2-106, L2-108, ADR 0068). */
export interface ConversationsApi {
  list(): Observable<LoadResult<ConversationList>>;
  get(youthId: string): Observable<LoadResult<Conversation>>;
  send(youthId: string, body: string): Observable<SendOutcome>;
}
