import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { AssignedYouth } from './assigned-youth';
import { CohortMentoring } from './cohort-mentoring';
import { MentoringApi } from './mentoring-api';

@Injectable()
export class HttpMentoringApi implements MentoringApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  youth(): Observable<LoadResult<AssignedYouth>> {
    return toLoad(this.http.get<AssignedYouth>(`${this.baseUrl}/mentoring/youth`));
  }

  cohort(programId: string): Observable<LoadResult<CohortMentoring>> {
    return toLoad(
      this.http.get<CohortMentoring>(`${this.baseUrl}/programs/${programId}/mentoring`),
    );
  }

  assignYouth(
    programId: string,
    childId: string,
    mentorId: string | null,
  ): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/programs/${programId}/youth/${childId}/mentor`, {
        mentorId,
      }),
    );
  }

  unassignYouth(programId: string, childId: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.delete<null>(`${this.baseUrl}/programs/${programId}/youth/${childId}/mentor`),
    );
  }

  setCohortMentors(
    programId: string,
    leadMentorId: string | null,
    supportingMentorIds: string[],
  ): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/programs/${programId}/mentors`, {
        leadMentorId,
        supportingMentorIds,
      }),
    );
  }
}
