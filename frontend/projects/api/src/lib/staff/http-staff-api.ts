import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { Role } from '../session/role';
import { WriteOutcome } from '../write-outcome';
import { StaffApi } from './staff-api';
import { Coverage } from './coverage';
import { StaffList } from './staff-list';
import { YouthAccount } from './youth-account';

@Injectable()
export class HttpStaffApi implements StaffApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<LoadResult<StaffList>> {
    return toLoad(this.http.get<StaffList>(`${this.baseUrl}/staff`));
  }

  invite(email: string, role: Role): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/staff/invitations`, { email, role }),
    );
  }

  withdraw(invitationId: string): Observable<WriteOutcome> {
    return toWrite(this.http.delete<null>(`${this.baseUrl}/staff/invitations/${invitationId}`));
  }

  resend(invitationId: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/staff/invitations/${invitationId}/resend`, null),
    );
  }

  changeRole(membershipId: string, role: Role): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/staff/${membershipId}/role`, { role }));
  }

  remove(membershipId: string): Observable<WriteOutcome> {
    return toWrite(this.http.delete<null>(`${this.baseUrl}/staff/${membershipId}`));
  }

  youthAccount(childId: string): Observable<LoadResult<YouthAccount>> {
    return toLoad(this.http.get<YouthAccount>(`${this.baseUrl}/children/${childId}/youth-account`));
  }

  inviteYouth(childId: string, email: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/children/${childId}/youth-invitation`, {
        email,
      }),
    );
  }

  coverage(): Observable<LoadResult<Coverage>> {
    return toLoad(this.http.get<Coverage>(`${this.baseUrl}/coverage`));
  }

  assign(sessionId: string, membershipIds: string[]): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/sessions/${sessionId}/staff`, { membershipIds }),
    );
  }
}
