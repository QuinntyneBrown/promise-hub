import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { PeopleApi } from './people-api';
import { PeoplePage } from './people-page';
import { PeopleQuery } from './people-query';
import { PersonRecord } from './person-record';

@Injectable()
export class HttpPeopleApi implements PeopleApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(query: PeopleQuery): Observable<LoadResult<PeoplePage>> {
    let params = new HttpParams().set('page', query.page);
    for (const key of ['q', 'role', 'status', 'programId'] as const) {
      if (query[key]) params = params.set(key, query[key]);
    }
    return toLoad(this.http.get<PeoplePage>(`${this.baseUrl}/people`, { params }));
  }

  get(id: string): Observable<LoadResult<PersonRecord>> {
    return toLoad(this.http.get<PersonRecord>(`${this.baseUrl}/people/${id}`));
  }

  deactivate(id: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/people/${id}/deactivate`, null));
  }

  reactivate(id: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/people/${id}/reactivate`, null));
  }
}
