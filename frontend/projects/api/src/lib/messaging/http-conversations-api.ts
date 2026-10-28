import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { Conversation } from './conversation';
import { ConversationList } from './conversation-list';
import { ConversationsApi } from './conversations-api';
import { DirectMessage } from './direct-message';
import { SendOutcome } from './send-outcome';

@Injectable()
export class HttpConversationsApi implements ConversationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<LoadResult<ConversationList>> {
    return toLoad(this.http.get<ConversationList>(`${this.baseUrl}/conversations`));
  }

  get(youthId: string): Observable<LoadResult<Conversation>> {
    return toLoad(this.http.get<Conversation>(`${this.baseUrl}/conversations/${youthId}`));
  }

  send(youthId: string, body: string): Observable<SendOutcome> {
    return this.http
      .post<DirectMessage>(`${this.baseUrl}/conversations/${youthId}/messages`, { body })
      .pipe(
        map((message): SendOutcome => ({ status: 'sent', message })),
        catchError((error: HttpErrorResponse) =>
          of<SendOutcome>(
            error.status === 422
              ? { status: 'invalid', errors: error.error?.errors ?? {} }
              : error.status === 409
                ? { status: 'blocked', reason: error.error?.blocked ?? 'consent' }
                : error.status === 404
                  ? { status: 'not-found' }
                  : error.status === 403
                    ? { status: 'forbidden' }
                    : { status: 'error' },
          ),
        ),
      );
  }
}
