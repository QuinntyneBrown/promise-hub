import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { LearningBondAgreement } from './learning-bond-agreement';
import { LearningBondApi } from './learning-bond-api';
import { GuardianPageResult } from '../guardian/guardian-page-result';
import { toGuardianPage } from '../guardian/to-guardian-page';
import { GuardianLearningBond } from './guardian-learning-bond';
import { LearningBondConsentPage } from './learning-bond-consent-page';
import { LearningBondEstimate } from './learning-bond-estimate';
import { LearningBondIntake } from './learning-bond-intake';
import { SaveLearningBondIntake } from './save-learning-bond-intake';
import { LearningBondFamilies } from './learning-bond-families';
import { LearningBondHousehold } from './learning-bond-household';
import { LearningBondInviteOutcome } from './learning-bond-invite-outcome';
import { LearningBondLaunch } from './learning-bond-launch';
import { LearningBondLink } from './learning-bond-link';
import { LearningBondMissingContact } from './learning-bond-missing-contact';
import { LearningBondStatus } from './learning-bond-status';
import { LearningBondInvitation } from './learning-bond-invitation';
import { LearningBondOverview } from './learning-bond-overview';
import { LearningBondSettings } from './learning-bond-settings';
import { RequestLearningBondSigner } from './request-learning-bond-signer';
import { SaveLearningBondSettings } from './save-learning-bond-settings';
import { LearningBondSignerAcceptance } from './learning-bond-signer-acceptance';
import { LearningBondSignerAgreement } from './learning-bond-signer-agreement';
import { LearningBondSignerOutcome } from './learning-bond-signer-outcome';
import { LearningBondSignerResult } from './learning-bond-signer-result';

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

  signerAgreement(token: string): Observable<LearningBondSignerResult> {
    return this.http
      .get<LearningBondSignerAgreement>(
        `${this.baseUrl}/sign/learning-bond/${encodeURIComponent(token)}`,
      )
      .pipe(
        map((value): LearningBondSignerResult => ({ status: 'loaded', value })),
        catchError((error: HttpErrorResponse) =>
          of<LearningBondSignerResult>(
            error.status === 410
              ? { status: 'expired', organization: error.error?.organization ?? '' }
              : error.status === 404
                ? { status: 'not-found' }
                : { status: 'error' },
          ),
        ),
      );
  }

  acceptAsSigner(token: string, authority: boolean): Observable<LearningBondSignerOutcome> {
    return this.http
      .post<LearningBondSignerAcceptance>(
        `${this.baseUrl}/sign/learning-bond/${encodeURIComponent(token)}/acceptances`,
        { authority },
      )
      .pipe(
        map((value): LearningBondSignerOutcome => ({ status: 'accepted', value })),
        catchError((error: HttpErrorResponse) =>
          of<LearningBondSignerOutcome>(
            error.status === 422
              ? { status: 'invalid', errors: error.error?.errors ?? {} }
              : error.status === 410
                ? { status: 'expired', organization: error.error?.organization ?? '' }
                : error.status === 404
                  ? { status: 'not-found' }
                  : { status: 'error' },
          ),
        ),
      );
  }

  launch(): Observable<LoadResult<LearningBondLaunch>> {
    return toLoad(this.http.get<LearningBondLaunch>(`${this.baseUrl}/learning-bond/launch`));
  }

  missingContacts(): Observable<LoadResult<LearningBondMissingContact[]>> {
    return toLoad(
      this.http
        .get<{
          households: LearningBondMissingContact[];
        }>(`${this.baseUrl}/learning-bond/launch/missing-contacts`)
        .pipe(map((r) => r.households)),
    );
  }

  families(
    status: string | null,
    programId: string | null,
  ): Observable<LoadResult<LearningBondFamilies>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (programId) params = params.set('program', programId);
    return toLoad(
      this.http.get<LearningBondFamilies>(`${this.baseUrl}/learning-bond/households`, { params }),
    );
  }

  recordCall(householdId: string, outcome: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(
        `${this.baseUrl}/learning-bond/households/${encodeURIComponent(householdId)}/call-outcome`,
        { outcome },
      ),
    );
  }

  household(householdId: string): Observable<LoadResult<LearningBondHousehold>> {
    return toLoad(
      this.http.get<LearningBondHousehold>(
        `${this.baseUrl}/learning-bond/households/${encodeURIComponent(householdId)}`,
      ),
    );
  }

  inviteHousehold(householdId: string): Observable<LearningBondInviteOutcome> {
    return this.http
      .post<{ invitedAt: string }>(
        `${this.baseUrl}/learning-bond/households/${encodeURIComponent(householdId)}/invitations`,
        null,
        { observe: 'response' },
      )
      .pipe(
        map((r: HttpResponse<{ invitedAt: string }>): LearningBondInviteOutcome => ({
          status: r.status === 201 ? 'invited' : 'already',
          invitedAt: r.body!.invitedAt,
        })),
        catchError((error: HttpErrorResponse) =>
          of<LearningBondInviteOutcome>(
            error.status === 404
              ? { status: 'not-found' }
              : error.status === 403
                ? { status: 'forbidden' }
                : { status: 'error' },
          ),
        ),
      );
  }

  scheduleLaunch(mode: 'Scheduled' | 'AtTheDoor', date: string | null): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/learning-bond/launch`, { mode, date }),
    );
  }

  moveLaunch(date: string): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/learning-bond/launch`, { date }));
  }

  cancelLaunch(): Observable<WriteOutcome> {
    return toWrite(this.http.delete<null>(`${this.baseUrl}/learning-bond/launch`));
  }

  guardianPage(token: string): Observable<GuardianPageResult<GuardianLearningBond>> {
    return toGuardianPage(
      this.http.get<GuardianLearningBond>(
        `${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}/page`,
      ),
    );
  }

  choose(token: string, choice: 'NotNow' | 'NotInterested'): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}/choice`, {
        choice,
      }),
    );
  }

  consentPage(token: string): Observable<GuardianPageResult<LearningBondConsentPage>> {
    return toGuardianPage(
      this.http.get<LearningBondConsentPage>(
        `${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}/consent`,
      ),
    );
  }

  giveConsent(token: string, childIds: string[], typedName: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(
        `${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}/consents`,
        {
          childIds,
          typedName,
        },
      ),
    );
  }

  intake(token: string, childId: string): Observable<GuardianPageResult<LearningBondIntake>> {
    return toGuardianPage(
      this.http.get<LearningBondIntake>(this.childUrl(token, childId, '/intake')),
    );
  }

  saveIntake(
    token: string,
    childId: string,
    answers: SaveLearningBondIntake,
  ): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(this.childUrl(token, childId, '/intake'), answers));
  }

  requestRecordFix(token: string, childId: string, note: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(this.childUrl(token, childId, '/intake/record-fix'), { note }),
    );
  }

  estimate(token: string, childId: string): Observable<GuardianPageResult<LearningBondEstimate>> {
    return toGuardianPage(
      this.http.get<LearningBondEstimate>(this.childUrl(token, childId, '/estimate')),
    );
  }

  private childUrl(token: string, childId: string, rest: string): string {
    return `${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}/children/${encodeURIComponent(childId)}${rest}`;
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

  requestSigner(request: RequestLearningBondSigner): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/learning-bond/agreement/signers`, request),
    );
  }

  resendSigner(id: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(
        `${this.baseUrl}/learning-bond/agreement/signers/${encodeURIComponent(id)}/resend`,
        null,
      ),
    );
  }

  settings(): Observable<LoadResult<LearningBondSettings>> {
    return toLoad(this.http.get<LearningBondSettings>(`${this.baseUrl}/learning-bond/settings`));
  }

  saveSettings(request: SaveLearningBondSettings): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/learning-bond/settings`, request));
  }

  overview(): Observable<LoadResult<LearningBondOverview>> {
    return toLoad(this.http.get<LearningBondOverview>(`${this.baseUrl}/learning-bond/overview`));
  }

  invitation(): Observable<LoadResult<LearningBondInvitation>> {
    return toLoad(
      this.http.get<LearningBondInvitation>(`${this.baseUrl}/learning-bond/invitation`),
    );
  }

  saveInvitation(senderName: string): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/learning-bond/invitation`, { senderName }));
  }

  cancelSigner(id: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.delete<null>(
        `${this.baseUrl}/learning-bond/agreement/signers/${encodeURIComponent(id)}`,
      ),
    );
  }
}
