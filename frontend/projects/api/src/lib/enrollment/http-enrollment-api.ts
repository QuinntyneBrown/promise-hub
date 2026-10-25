import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { EnrollmentApi } from './enrollment-api';
import { EnrollmentRequest } from './enrollment-request';
import { ReviewDecision } from './review-decision';

@Injectable()
export class HttpEnrollmentApi implements EnrollmentApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  requests(
    programId: string,
    status: 'WaitingReview' | 'Waitlisted',
  ): Observable<LoadResult<{ requests: EnrollmentRequest[] }>> {
    return toLoad(
      this.http.get<{ requests: EnrollmentRequest[] }>(
        `${this.baseUrl}/programs/${programId}/enrollments`,
        { params: { status } },
      ),
    );
  }

  review(id: string, decision: ReviewDecision, note: string | null): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/enrollments/${id}/review`, { decision, note }),
    );
  }

  bulk(ids: string[], decision: ReviewDecision, note: string | null): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/enrollments/review`, { ids, decision, note }),
    );
  }
}
