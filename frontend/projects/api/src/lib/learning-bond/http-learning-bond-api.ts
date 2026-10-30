import { HttpClient, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
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
import { LearningBondApplication } from './learning-bond-application';
import { LearningBondApplicationChange } from './learning-bond-application-change';
import { LearningBondEstimate } from './learning-bond-estimate';
import { LearningBondProgress } from './learning-bond-progress';
import { LearningBondPaused } from './learning-bond-paused';
import { LearningBondDashboard } from './learning-bond-dashboard';
import { LearningBondExportCreated } from './learning-bond-export-created';
import { LearningBondReminders } from './learning-bond-reminders';
import { LearningBondTotal } from './learning-bond-total';
import { Benefits } from './benefits';
import { BenefitsConsent } from './benefits-consent';
import { BenefitsIntake } from './benefits-intake';
import { SaveBenefitsIntake } from './save-benefits-intake';
import { BenefitReview } from './benefit-review';
import { BenefitReviewChange } from './benefit-review-change';
import { LearningBondSubmitOutcome } from './learning-bond-submit-outcome';
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

  prepareApplication(
    token: string,
    childId: string,
  ): Observable<GuardianPageResult<LearningBondApplication>> {
    return toGuardianPage(
      this.http.post<LearningBondApplication>(this.childUrl(token, childId, '/applications'), null),
    );
  }

  editApplicationField(
    token: string,
    id: string,
    field: string,
    value: string,
  ): Observable<LearningBondApplicationChange> {
    return this.change(
      this.http.patch<LearningBondApplication>(
        `${this.applicationUrl(token, id)}/fields/${encodeURIComponent(field)}`,
        { value },
      ),
    );
  }

  chooseProvider(
    token: string,
    id: string,
    name: string,
  ): Observable<LearningBondApplicationChange> {
    return this.change(
      this.http.put<LearningBondApplication>(`${this.applicationUrl(token, id)}/provider`, {
        name,
      }),
    );
  }

  submitApplication(
    token: string,
    id: string,
    reviewVersion: number,
  ): Observable<LearningBondSubmitOutcome> {
    return this.outcome(
      this.http.post<unknown>(`${this.applicationUrl(token, id)}/submit`, { reviewVersion }),
    );
  }

  progress(
    token: string,
    childId: string,
  ): Observable<GuardianPageResult<LearningBondProgress | null>> {
    // 409 means not sent yet: the page says so rather than failing.
    return toGuardianPage(
      this.http
        .get<LearningBondProgress>(this.childUrl(token, childId, '/progress'))
        .pipe(
          catchError((error: HttpErrorResponse) =>
            error.status === 409 ? of(null) : throwError(() => error),
          ),
        ),
    );
  }

  dashboard(program: string | null, period: string): Observable<LoadResult<LearningBondDashboard>> {
    let params = new HttpParams().set('period', period);
    if (program) params = params.set('program', program);
    return toLoad(
      this.http.get<LearningBondDashboard>(`${this.baseUrl}/learning-bond/dashboard`, { params }),
    );
  }

  exportForFunders(period: string): Observable<LearningBondExportCreated | null> {
    return this.http
      .post<LearningBondExportCreated>(`${this.baseUrl}/learning-bond/exports`, { period })
      .pipe(catchError(() => of(null)));
  }

  exportUrl(id: string): string {
    return `${this.baseUrl}/reports/exports/${encodeURIComponent(id)}`;
  }

  reminders(token: string): Observable<GuardianPageResult<LearningBondReminders>> {
    return toGuardianPage(
      this.http.get<LearningBondReminders>(`${this.guardianUrl(token)}/reminders`),
    );
  }

  turnOffReminder(token: string, id: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(
        `${this.guardianUrl(token)}/reminders/${encodeURIComponent(id)}/off`,
        null,
      ),
    );
  }

  total(token: string): Observable<GuardianPageResult<LearningBondTotal>> {
    return toGuardianPage(this.http.get<LearningBondTotal>(`${this.guardianUrl(token)}/total`));
  }

  dismissBenefitsOffer(token: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.guardianUrl(token)}/benefits/offer/dismiss`, null));
  }

  benefitsConsent(token: string): Observable<GuardianPageResult<BenefitsConsent>> {
    return toGuardianPage(
      this.http.get<BenefitsConsent>(`${this.guardianUrl(token)}/benefits/consent`),
    );
  }

  giveBenefitsConsent(token: string, typedName: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(`${this.guardianUrl(token)}/consents`, { scope: 'Benefits', typedName }),
    );
  }

  benefitsIntake(token: string): Observable<GuardianPageResult<BenefitsIntake>> {
    return toGuardianPage(
      this.http.get<BenefitsIntake>(`${this.guardianUrl(token)}/benefits/intake`),
    );
  }

  saveBenefitsIntake(token: string, answers: SaveBenefitsIntake): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.guardianUrl(token)}/benefits/intake`, answers));
  }

  benefits(token: string): Observable<GuardianPageResult<Benefits>> {
    return toGuardianPage(this.http.get<Benefits>(`${this.guardianUrl(token)}/benefits`));
  }

  uploadBenefitDocument(token: string, key: string, file: File): Observable<WriteOutcome> {
    const form = new FormData();
    form.append('file', file, file.name);
    return toWrite(
      this.http.post<{ id: string }>(
        `${this.guardianUrl(token)}/benefits/${encodeURIComponent(key)}/document`,
        form,
      ),
    );
  }

  prepareBenefit(token: string, key: string): Observable<GuardianPageResult<BenefitReview>> {
    return toGuardianPage(
      this.http.post<BenefitReview>(
        `${this.guardianUrl(token)}/benefits/${encodeURIComponent(key)}/applications`,
        null,
      ),
    );
  }

  editBenefitField(
    token: string,
    id: string,
    field: string,
    value: string,
  ): Observable<BenefitReviewChange> {
    return this.http
      .patch<BenefitReview>(`${this.benefitUrl(token, id)}/fields/${encodeURIComponent(field)}`, {
        value,
      })
      .pipe(
        map((value): BenefitReviewChange => ({ status: 'saved', value })),
        catchError((error: HttpErrorResponse) =>
          of<BenefitReviewChange>(
            error.status === 422
              ? { status: 'invalid', errors: error.error?.errors ?? {} }
              : { status: 'error' },
          ),
        ),
      );
  }

  submitBenefit(
    token: string,
    id: string,
    reviewVersion: number,
  ): Observable<LearningBondSubmitOutcome> {
    return this.outcome(
      this.http.post<unknown>(`${this.benefitUrl(token, id)}/submit`, { reviewVersion }),
    );
  }

  markBenefitSent(token: string, id: string): Observable<WriteOutcome> {
    return toWrite(this.http.post<null>(`${this.benefitUrl(token, id)}/sent`, null));
  }

  benefitFormUrl(token: string, id: string): string {
    return `${this.benefitUrl(token, id)}/form`;
  }

  private guardianUrl(token: string): string {
    return `${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}`;
  }

  private benefitUrl(token: string, id: string): string {
    return `${this.guardianUrl(token)}/benefits/applications/${encodeURIComponent(id)}`;
  }

  withdrawConsent(token: string, consentId: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.delete<null>(
        `${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}/consents/${encodeURIComponent(consentId)}`,
      ),
    );
  }

  pauseClaim(token: string, childId: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<null>(this.childUrl(token, childId, '/pause'), { reason: 'NeedsSin' }),
    );
  }

  paused(token: string, childId: string): Observable<GuardianPageResult<LearningBondPaused>> {
    return toGuardianPage(
      this.http.get<LearningBondPaused>(this.childUrl(token, childId, '/paused')),
    );
  }

  setReminder(
    token: string,
    childId: string,
    remind: boolean,
  ): Observable<LearningBondPaused | null> {
    return this.http
      .put<LearningBondPaused>(this.childUrl(token, childId, '/reminder'), { remind })
      .pipe(catchError(() => of(null)));
  }

  uploadDocument(token: string, documentId: string, file: File): Observable<WriteOutcome> {
    const form = new FormData();
    form.append('file', file, file.name);
    return toWrite(
      this.http.post<{ id: string }>(`${this.documentUrl(token, documentId)}/file`, form),
    );
  }

  sendDocument(token: string, documentId: string): Observable<LearningBondSubmitOutcome> {
    return this.outcome(
      this.http.post<unknown>(`${this.documentUrl(token, documentId)}/send`, null),
    );
  }

  private documentUrl(token: string, documentId: string): string {
    return `${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}/documents/${encodeURIComponent(documentId)}`;
  }

  private outcome(call: Observable<unknown>): Observable<LearningBondSubmitOutcome> {
    return call.pipe(
      map((): LearningBondSubmitOutcome => ({ status: 'sent' })),
      catchError((error: HttpErrorResponse) =>
        of<LearningBondSubmitOutcome>(
          error.status === 502
            ? { status: 'not-sent' }
            : error.status === 409
              ? { status: error.error?.code === 'stale-review' ? 'stale' : 'incomplete' }
              : { status: 'error' },
        ),
      ),
    );
  }

  private change(
    call: Observable<LearningBondApplication>,
  ): Observable<LearningBondApplicationChange> {
    return call.pipe(
      map((value): LearningBondApplicationChange => ({ status: 'saved', value })),
      catchError((error: HttpErrorResponse) =>
        of<LearningBondApplicationChange>(
          error.status === 422
            ? { status: 'invalid', errors: error.error?.errors ?? {} }
            : { status: 'error' },
        ),
      ),
    );
  }

  private applicationUrl(token: string, id: string): string {
    return `${this.baseUrl}/g/learning-bond/${encodeURIComponent(token)}/applications/${encodeURIComponent(id)}`;
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
