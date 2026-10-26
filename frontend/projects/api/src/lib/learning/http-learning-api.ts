import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { LearningApi } from './learning-api';
import { Learner } from './learner';

@Injectable()
export class HttpLearningApi implements LearningApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  learner(): Observable<LoadResult<Learner>> {
    return toLoad(this.http.get<Learner>(`${this.baseUrl}/learning/me`));
  }
}
