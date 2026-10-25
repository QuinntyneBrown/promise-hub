import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { AudienceRequest } from './audience-request';
import { MessageDetail } from './message-detail';
import { MessageList } from './message-list';
import { MessagePreview } from './message-preview';
import { MessagingApi } from './messaging-api';
import { SmsCap } from './sms-cap';

@Injectable()
export class HttpMessagingApi implements MessagingApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<LoadResult<MessageList>> {
    return toLoad(this.http.get<MessageList>(`${this.baseUrl}/messages`));
  }

  preview(request: AudienceRequest): Observable<LoadResult<MessagePreview>> {
    return toLoad(this.http.post<MessagePreview>(`${this.baseUrl}/messages/preview`, request));
  }

  send(request: AudienceRequest): Observable<WriteOutcome> {
    return toWrite(this.http.post<{ id: string }>(`${this.baseUrl}/messages`, request));
  }

  get(id: string): Observable<LoadResult<MessageDetail>> {
    return toLoad(this.http.get<MessageDetail>(`${this.baseUrl}/messages/${id}`));
  }

  smsCap(): Observable<LoadResult<SmsCap>> {
    return toLoad(this.http.get<SmsCap>(`${this.baseUrl}/messaging/sms-cap`));
  }
}
