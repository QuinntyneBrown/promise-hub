import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { AnnouncementList } from './announcement-list';
import { AnnouncementsApi } from './announcements-api';
import { ComposeAnnouncement } from './compose-announcement';

@Injectable()
export class HttpAnnouncementsApi implements AnnouncementsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<LoadResult<AnnouncementList>> {
    return toLoad(this.http.get<AnnouncementList>(`${this.baseUrl}/announcements`));
  }

  compose(request: ComposeAnnouncement): Observable<WriteOutcome> {
    return toWrite(this.http.post<{ id: string }>(`${this.baseUrl}/announcements`, request));
  }
}
