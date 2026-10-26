import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { Account } from './account';
import { AccountApi } from './account-api';

@Injectable()
export class HttpAccountApi implements AccountApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  load(): Observable<LoadResult<Account>> {
    return toLoad(this.http.get<Account>(`${this.baseUrl}/me/account`));
  }

  newRecoveryCodes(): Observable<LoadResult<{ codes: string[] }>> {
    return toLoad(this.http.post<{ codes: string[] }>(`${this.baseUrl}/me/recovery-codes`, null));
  }

  signOutOthers(): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.baseUrl}/me/sign-out-others`, null));
  }
}
