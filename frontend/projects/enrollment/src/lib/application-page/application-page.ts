import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { APPLICATIONS_API, Application, LoadResult, SESSION_API, can } from '@promisehub/api';
import {
  Fact,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhErrorPage,
  PhPageHeader,
  PhSkeleton,
  PhTimeline,
  TimelineEntry,
  ToastService,
  formatDate,
  formatDateTime,
} from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';
import { AddNoteData, AddNoteDialog } from '../add-note-dialog/add-note-dialog';
import {
  PlaceApplicantData,
  PlaceApplicantDialog,
  PlaceApplicantResult,
} from '../place-applicant-dialog/place-applicant-dialog';

const STATUS: Record<Application['status'], string> = {
  WaitingReview: 'Waiting review',
  Waitlisted: 'Waitlisted',
  Accepted: 'Accepted',
  Declined: 'Declined',
};

/**
 * One application (mock: application, L2-072): the young person, who applied and why, the referrer, the family and the staff notes.
 * Only admins and program directors open it; another organization's application is not found.
 */
@Component({
  selector: 'ph-application-page',
  imports: [
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhErrorPage,
    PhPageHeader,
    PhSkeleton,
    PhTimeline,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './application-page.html',
})
export class ApplicationPage {
  private readonly api = inject(APPLICATIONS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  readonly id = input.required<string>();

  protected readonly result = signal<LoadResult<Application> | null>(null);
  protected readonly allowed = computed(
    () => !this.me() || can(this.me()!.role, 'reviewEnrollments'),
  );

  constructor() {
    effect(() => {
      if (this.allowed()) this.load(this.id());
    });
  }

  protected open(a: Application): boolean {
    return a.status === 'WaitingReview' || a.status === 'Waitlisted';
  }

  /** Who decided, when and what the family read, once accepted or declined (L2-072 criterion 7). */
  protected outcome(
    a: Application,
  ): { tone: 'success' | 'info'; title: string; text: string } | null {
    const when = a.reviewedAt ? ` on ${formatDate(a.reviewedAt)}` : '';
    const who = a.reviewedBy ?? 'Staff';
    const family = a.guardian?.name ?? 'The family';
    if (a.status === 'Accepted')
      return {
        tone: 'success',
        title: `Placed in ${a.program}`,
        text: `${who} placed ${a.firstName}${when}. ${family} was texted${a.note ? `: “${a.note}”` : '.'}`,
      };
    if (a.status === 'Declined')
      return {
        tone: 'info',
        title: 'Declined',
        text: `${who} declined${when}. ${family} read: “${a.note ?? ''}”`,
      };
    return null;
  }

  protected place(a: Application): void {
    const me = this.me();
    const canInvite =
      !!me &&
      can(me.role, 'manageStaff') &&
      me.modules.includes('Learning') &&
      a.age !== null &&
      a.age >= 12 &&
      a.age <= 18;
    this.dialogs
      .open<PlaceApplicantResult, PlaceApplicantData, PlaceApplicantDialog>(PlaceApplicantDialog, {
        application: a,
        canInvite,
      })
      .closed.subscribe((done) => {
        if (!done) return;
        this.toasts.show({
          tone: 'success',
          title: `${a.child} placed`,
          text: `${a.guardian?.name ?? 'The family'} is texted.${done.invited ? ' The youth invitation is sent.' : ''}`,
        });
        this.load(a.id);
      });
  }

  protected load(id: string): void {
    this.api.get(id).subscribe((r) => this.result.set(r));
  }

  protected subtitle(a: Application): string {
    const age = a.age !== null ? `${a.age} · ` : '';
    return `${age}applied ${formatDate(a.submittedAt)} for ${a.program}`;
  }

  protected youngPerson(a: Application): Fact[] {
    const status =
      a.status === 'Waitlisted' && a.position !== null
        ? `Waitlisted, #${a.position}`
        : STATUS[a.status];
    return [
      { key: 'name', term: 'Name', value: a.child },
      {
        key: 'born',
        term: 'Date of birth',
        value: a.dateOfBirth
          ? `${formatDate(a.dateOfBirth)}${a.age !== null ? ` (${a.age})` : ''}`
          : 'Not given',
      },
      { key: 'program', term: 'Applied for', value: a.program },
      { key: 'applied', term: 'Applied', value: formatDateTime(a.submittedAt) },
      { key: 'status', term: 'Status', value: status },
      { key: 'consent', term: 'Season consent', value: this.consent(a) },
    ];
  }

  protected referral(a: Application): Fact[] {
    const r = a.referrer!;
    return [
      { key: 'referrer', term: 'Referred by', value: r.name },
      ...(r.role ? [{ key: 'role', term: 'Role', value: r.role }] : []),
      ...(r.organization
        ? [{ key: 'organization', term: 'Organization', value: r.organization }]
        : []),
      ...(r.contact ? [{ key: 'contact', term: 'Verified contact', value: r.contact }] : []),
      ...(a.reason ? [{ key: 'reason', term: 'Why', value: a.reason }] : []),
    ];
  }

  protected applicationFacts(a: Application): Fact[] {
    const by =
      a.appliedAs === 'Youth'
        ? `${a.child}, the young person`
        : `${a.appliedBy}, parent or guardian`;
    return [
      { key: 'applied-by', term: 'Applied by', value: by },
      ...(a.reason ? [{ key: 'reason', term: 'Why', value: a.reason }] : []),
    ];
  }

  protected family(a: Application): Fact[] {
    const g = a.guardian;
    return [
      ...(g
        ? [
            { key: 'guardian', term: 'Parent or guardian', value: g.name },
            ...(g.mobile ? [{ key: 'mobile', term: 'Mobile', value: g.mobile }] : []),
            ...(g.email ? [{ key: 'email', term: 'Email', value: g.email }] : []),
            { key: 'language', term: 'Messages in', value: g.language },
          ]
        : []),
      {
        key: 'household',
        term: 'Household',
        value: `${a.household} · ${a.returning ? 'returning' : 'new'} household`,
      },
    ];
  }

  protected notes(a: Application): TimelineEntry[] {
    return a.notes.map((n) => ({
      key: n.id,
      actor: n.author,
      text: n.text,
      meta: formatDateTime(n.createdAt),
    }));
  }

  protected addNote(a: Application): void {
    this.dialogs
      .open<boolean, AddNoteData, AddNoteDialog>(AddNoteDialog, { applicationId: a.id })
      .closed.subscribe((done) => {
        if (!done) return;
        this.toasts.show({ tone: 'success', title: 'Note added' });
        this.load(a.id);
      });
  }

  private consent(a: Application): string {
    if (a.seasonConsent) return 'Given';
    const guardian = a.guardian?.name ?? 'their guardian';
    return a.appliedAs === 'Youth'
      ? `Not given yet: ${a.firstName} is under 18, so ${guardian} consents`
      : `Not given yet: collect it from ${guardian.split(' ')[0]}`;
  }
}
