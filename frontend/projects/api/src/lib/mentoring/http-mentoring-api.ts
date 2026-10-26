import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { MentoringApi } from './mentoring-api';
import { AssignedYouth } from './assigned-youth';

@Injectable()
export class HttpMentoringApi implements MentoringApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  youth(): Observable<LoadResult<AssignedYouth>> {
    return toLoad(this.http.get<AssignedYouth>(`${this.baseUrl}/mentoring/youth`));
  }
}
