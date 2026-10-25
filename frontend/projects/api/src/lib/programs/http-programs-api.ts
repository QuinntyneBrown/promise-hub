import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { Program } from './program';
import { ProgramFields } from './program-fields';
import { ProgramList } from './program-list';
import { ProgramsApi } from './programs-api';

@Injectable()
export class HttpProgramsApi implements ProgramsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(status: 'active' | 'archived'): Observable<LoadResult<ProgramList>> {
    return toLoad(
      this.http.get<ProgramList>(`${this.baseUrl}/programs`, {
        params: new HttpParams().set('status', status),
      }),
    );
  }

  get(id: string): Observable<LoadResult<Program>> {
    return toLoad(this.http.get<Program>(`${this.baseUrl}/programs/${id}`));
  }

  create(fields: ProgramFields): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/programs`, {
        ...fields,
        capacity: fields.capacity ?? 0,
      }),
    );
  }

  update(id: string, fields: ProgramFields): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/programs/${id}`, {
        ...fields,
        capacity: fields.capacity ?? 0,
      }),
    );
  }

  archive(id: string, confirmName: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/programs/${id}/archive`, { confirmName }));
  }

  openEnrollment(id: string): Observable<LoadResult<{ url: string }>> {
    return toLoad(
      this.http.post<{ url: string }>(`${this.baseUrl}/programs/${id}/enrollment/open`, {}),
    );
  }

  closeEnrollment(id: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/programs/${id}/enrollment/close`, {}));
  }

  restore(id: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/programs/${id}/restore`, {}));
  }

  enroll(id: string, childId: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/programs/${id}/enrollments`, { childId }),
    );
  }

  removeFromRoster(id: string, childId: string, reason: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.delete<null>(`${this.baseUrl}/programs/${id}/enrollments/${childId}`, {
        body: { reason },
      }),
    );
  }
}
