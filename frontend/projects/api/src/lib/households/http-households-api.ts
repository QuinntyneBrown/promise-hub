import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { Child } from './child';
import { ChildMatch } from './child-match';
import { ChildChanges } from './child-changes';
import { GuardianChanges } from './guardian-changes';
import { Household } from './household';
import { HouseholdList } from './household-list';
import { HouseholdsApi } from './households-api';
import { MedicalChanges } from './medical-changes';
import { NewChild } from './new-child';
import { NewFamily } from './new-family';
import { NewGuardian } from './new-guardian';
import { ChildConsent } from '../consent/child-consent';
import { ConsentRequestOutcome } from '../consent/consent-request-outcome';
import { toConsentRequest } from '../consent/to-consent-request';

@Injectable()
export class HttpHouseholdsApi implements HouseholdsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(q: string, filter: string): Observable<LoadResult<HouseholdList>> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    if (filter && filter !== 'all') params = params.set('filter', filter);
    return toLoad(this.http.get<HouseholdList>(`${this.baseUrl}/households`, { params }));
  }

  get(id: string): Observable<LoadResult<Household>> {
    return toLoad(this.http.get<Household>(`${this.baseUrl}/households/${id}`));
  }

  getChild(id: string): Observable<LoadResult<Child>> {
    return toLoad(this.http.get<Child>(`${this.baseUrl}/children/${id}`));
  }

  findChildren(q: string): Observable<LoadResult<{ children: ChildMatch[] }>> {
    return toLoad(
      this.http.get<{ children: ChildMatch[] }>(`${this.baseUrl}/children`, {
        params: new HttpParams().set('q', q),
      }),
    );
  }

  create(family: NewFamily): Observable<WriteOutcome> {
    return toWrite(this.http.post<{ id: string }>(`${this.baseUrl}/households`, family));
  }

  addChild(householdId: string, child: NewChild): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/households/${householdId}/children`, child),
    );
  }

  addGuardian(householdId: string, guardian: NewGuardian): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(
        `${this.baseUrl}/households/${householdId}/guardians`,
        guardian,
      ),
    );
  }

  updateGuardian(id: string, changes: GuardianChanges): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/guardians/${id}`, changes));
  }

  updateChild(id: string, changes: ChildChanges): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/children/${id}`, changes));
  }

  updateMedical(id: string, changes: MedicalChanges): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/children/${id}/medical`, changes));
  }

  consent(childId: string): Observable<LoadResult<ChildConsent>> {
    return toLoad(this.http.get<ChildConsent>(`${this.baseUrl}/children/${childId}/consent`));
  }

  sendConsentLink(childId: string): Observable<ConsentRequestOutcome> {
    return toConsentRequest(
      this.http.post<{ sentTo: string[] }>(
        `${this.baseUrl}/children/${childId}/consent-request`,
        null,
      ),
    );
  }

  delete(id: string, reason: string, confirmName: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.delete<null>(`${this.baseUrl}/households/${id}`, { body: { reason, confirmName } }),
    );
  }
}
