import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { CurriculumApi } from './curriculum-api';
import { Curriculum } from './curriculum';

@Injectable()
export class HttpCurriculumApi implements CurriculumApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  tracks(): Observable<LoadResult<Curriculum>> {
    return toLoad(this.http.get<Curriculum>(`${this.baseUrl}/curriculum`));
  }
}
