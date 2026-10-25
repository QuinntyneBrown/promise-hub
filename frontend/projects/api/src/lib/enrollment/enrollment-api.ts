import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { EnrollmentRequest } from './enrollment-request';
import type { ReviewDecision } from './review-decision';

/** Staff review of enrollments: the queue, and decisions one by one or in bulk. */
export interface EnrollmentApi {
  requests(
    programId: string,
    status: 'WaitingReview' | 'Waitlisted',
  ): Observable<LoadResult<{ requests: EnrollmentRequest[] }>>;
  review(id: string, decision: ReviewDecision, note: string | null): Observable<WriteOutcome>;
  bulk(ids: string[], decision: ReviewDecision, note: string | null): Observable<WriteOutcome>;
}
