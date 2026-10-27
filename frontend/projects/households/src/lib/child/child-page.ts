import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  Child,
  ChildConsent,
  HOUSEHOLDS_API,
  LoadResult,
  SESSION_API,
  STAFF_API,
  YouthAccount,
  can,
} from '@promisehub/api';
import {
  Fact,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhBadge,
  PhErrorPage,
  PhList,
  PhListItem,
  PhPageHeader,
  ToastService,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, of, startWith, switchMap } from 'rxjs';
import { formatDate } from '../dates';
import { EditChildDialog } from '../edit-child/edit-child-dialog';
import { EditMedicalDialog } from '../edit-medical/edit-medical-dialog';
import { InviteYouthDialog } from '../invite-youth/invite-youth-dialog';

/**
 * A child's profile (mock: child): details, the medical and emergency card and, for admins while Learning is on, the
 * youth account of a child aged 12 to 18 (L2-051).
 */
@Component({
  selector: 'ph-child-page',
  imports: [
    PhBadge,
    PhList,
    PhListItem,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhErrorPage,
    PhPageHeader,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './child-page.html',
})
export class ChildPage {
  private readonly api = inject(HOUSEHOLDS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  private readonly refresh$ = new Subject<void>();
  private readonly staff = inject(STAFF_API);
  private readonly youthRefresh$ = new Subject<void>();
  private readonly consentRefresh$ = new Subject<void>();

  /** Route parameters. */
  readonly householdId = input.required<string>();
  readonly childId = input.required<string>();

  protected readonly canWrite = computed(
    () => !!this.session() && can(this.session()!.role, 'writeHouseholds'),
  );
  protected readonly canWriteMedical = computed(
    () => !!this.session() && can(this.session()!.role, 'writeMedical'),
  );
  protected readonly result = toSignal<LoadResult<Child> | null>(
    toObservable(this.childId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() => this.api.getChild(id)),
        ),
      ),
    ),
    { initialValue: null },
  );

  /** The child whose Youth account card shows: admins only, Learning on, aged 12 to 18 (ADR 0045). */
  protected readonly youthChild = computed<Child | null>(() => {
    const session = this.session();
    const r = this.result();
    if (!session || r?.status !== 'loaded') return null;
    const c = r.value;
    const eligible =
      can(session.role, 'manageStaff') &&
      session.modules.includes('Learning') &&
      c.age !== null &&
      c.age >= 12 &&
      c.age <= 18;
    return eligible ? c : null;
  });
  protected readonly youthAccount = toSignal<LoadResult<YouthAccount> | null>(
    toObservable(this.youthChild).pipe(
      switchMap((c) =>
        c
          ? this.youthRefresh$.pipe(
              startWith(undefined),
              switchMap(() => this.staff.youthAccount(c.id)),
            )
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  /** Guardian consent (L2-058): read by every staff role while Roster is on; rendered only when the child needs consent. */
  protected readonly consent = toSignal<LoadResult<ChildConsent> | null>(
    toObservable(this.childId).pipe(
      switchMap((id) =>
        this.consentRefresh$.pipe(
          startWith(undefined),
          switchMap(() => this.api.consent(id)),
        ),
      ),
    ),
    { initialValue: null },
  );
  protected readonly sendingConsent = signal(false);

  protected consentMeta(c: Child, consent: ChildConsent): string {
    if (consent.status === 'Given')
      return `Given by ${consent.signedBy} (${consent.relationship}) · ${this.when(consent.signedAt)} · ${consent.reference}`;
    if (consent.status === 'Withdrawn')
      return `Withdrawn by ${consent.withdrawnBy} · ${this.when(consent.withdrawnAt)}`;
    return consent.linkSentAt
      ? `Link sent · ${this.when(consent.linkSentAt)}`
      : `Needed before ${c.firstName} can use Learning · under ${consent.consentAge}`;
  }

  private when(iso: string | null): string {
    return iso
      ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(iso),
        )
      : '';
  }

  /** Texts or emails the household a consent link (admins and program directors). */
  protected sendConsentLink(c: Child): void {
    this.sendingConsent.set(true);
    this.api.sendConsentLink(c.id).subscribe((outcome) => {
      this.sendingConsent.set(false);
      if (outcome.status === 'sent') {
        this.toasts.show({
          tone: 'success',
          title: 'Consent link sent',
          text: `Sent to ${outcome.sentTo.join(', ')}.`,
        });
        this.consentRefresh$.next();
      } else if (outcome.status === 'no-guardian') {
        this.toasts.show({
          tone: 'danger',
          title: 'No guardian to reach',
          text: `Add a mobile or email for a guardian of ${c.firstName} who may sign.`,
        });
      } else {
        this.toasts.show({
          tone: 'danger',
          title: 'Consent link not sent',
          text: 'Something went wrong. Try again.',
        });
      }
    });
  }

  protected inviteYouth(c: Child): void {
    this.dialogs
      .open<boolean, Child, InviteYouthDialog>(InviteYouthDialog, c)
      .closed.subscribe((sent) => {
        if (sent) {
          this.toasts.show({
            tone: 'success',
            title: 'Invitation sent',
            text: `${c.firstName}’s link lasts 14 days.`,
          });
          this.youthRefresh$.next();
        }
      });
  }

  /** "Expires 19 Nov 2026", or "Expired …" once the link has timed out and waits to be resent. */
  protected expiry(iso: string | null): string {
    if (!iso) return '';
    return `${new Date(iso).getTime() <= Date.now() ? 'Expired' : 'Expires'} ${formatDate(iso)}`;
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected subtitle(c: Child): string {
    const age =
      c.age === null
        ? null
        : c.dateOfBirth
          ? `${c.age} years (born ${formatDate(c.dateOfBirth)})`
          : `${c.age} years`;
    return [age, c.school, `${c.householdName} household`].filter(Boolean).join(' · ');
  }

  protected facts(c: Child): Fact[] {
    const m = c.medical!;
    return [
      {
        key: 'allergies',
        term: 'Allergies',
        value: m.allergies ? `${m.redAlert ? 'Red alert · ' : ''}${m.allergies}` : 'None',
      },
      { key: 'medication', term: 'Medication', value: m.medication ?? 'None' },
      { key: 'conditions', term: 'Conditions', value: m.conditions ?? 'None' },
      { key: 'doctor', term: 'Doctor', value: m.doctor ?? 'Not given' },
      {
        key: 'updated',
        term: 'Updated',
        value: m.updatedBy ? `By ${m.updatedBy} · ${formatDate(m.updatedAt)}` : 'Never',
      },
    ];
  }

  protected edit(c: Child): void {
    this.dialogs
      .open<boolean, Child, EditChildDialog>(EditChildDialog, c)
      .closed.subscribe((saved) => saved && this.reload());
  }

  protected editMedical(c: Child): void {
    this.dialogs
      .open<boolean, Child, EditMedicalDialog>(EditMedicalDialog, c)
      .closed.subscribe((saved) => {
        if (saved) {
          this.toasts.show({
            tone: 'success',
            title: 'Medical details saved',
            text: 'The change is logged.',
          });
          this.reload();
        }
      });
  }
}
