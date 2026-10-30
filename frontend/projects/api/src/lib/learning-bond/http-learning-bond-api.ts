import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { LearningBondAgreement } from './learning-bond-agreement';
import { LearningBondApi } from './learning-bond-api';
import { LearningBondLink } from './learning-bond-link';
import { LearningBondStatus } from './learning-bond-status';

@Injectable()
export class HttpLearningBondApi implements LearningBondApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  status(): Observable<LoadResult<LearningBondStatus>> {
    return toLoad(this.http.get<LearningBondStatus>(`${this.baseUrl}/learning-bond`));
  }

  link(token: string): Observable<LoadResult<LearningBondLink>> {
    return toLoad(
      this.http.get<LearningBondLink>(
        `${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}`,
      ),
    );
  }

  agreement(): Observable<LoadResult<LearningBondAgreement>> {
    return toLoad(this.http.get<LearningBondAgreement>(`${this.baseUrl}/learning-bond/agreement`));
  }

  acceptAgreement(authority: boolean): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/learning-bond/agreement/acceptances`, {
        authority,
      }),
    );
  }
}
