import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  APPLICATIONS_API,
  ApplicationList,
  ApplicationStatus,
  ApplicationSummary,
  LoadResult,
  SESSION_API,
  can,
} from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhErrorPage,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhTabs,
  TabItem,
  formatDate,
} from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';

/** Who applied, as the pipeline and the application page say it. */
export function appliedByText(a: ApplicationSummary): string {
  if (a.appliedAs === 'Referrer')
    return `referred by ${a.appliedBy}${a.referrerRole ? ', ' + a.referrerRole : ''}`;
  if (a.appliedAs === 'Youth') return 'applied for themselves';
  return a.appliedBy;
}

/**
 * Applications (mock: applications, L2-072): the organization's enrollment requests by status, newest first, with who applied and
 * the program; each row opens the application. Only admins and program directors review them.
 */
@Component({
  selector: 'ph-applications-page',
  imports: [
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorPage,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './applications-page.html',
})
export class ApplicationsPage {
  private readonly api = inject(APPLICATIONS_API);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  protected readonly status = signal<ApplicationStatus>('WaitingReview');
  protected readonly result = signal<LoadResult<ApplicationList> | null>(null);
  protected readonly allowed = computed(
    () => !this.me() || can(this.me()!.role, 'reviewEnrollments'),
  );
  private readonly counts = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.counts : null;
  });
  protected readonly tabs = computed<TabItem[]>(() => {
    const c = this.counts();
    return [
      { value: 'WaitingReview', label: 'Waiting review', count: c?.waitingReview },
      { value: 'Waitlisted', label: 'Waitlisted', count: c?.waitlisted },
      { value: 'Accepted', label: 'Accepted', count: c?.accepted },
      { value: 'Declined', label: 'Declined', count: c?.declined },
    ];
  });
  protected readonly subtitle = computed(() => {
    const c = this.counts();
    if (!c) return null;
    const waiting = c.waitingReview
      ? `${c.waitingReview} waiting review`
      : 'Nothing waiting review';
    return `${waiting} · ${c.waitlisted} waitlisted · every program`;
  });

  constructor() {
    effect(() => {
      if (this.allowed()) this.load(this.status());
    });
  }

  protected load(status: ApplicationStatus): void {
    this.result.set(null);
    this.api.list(status).subscribe((r) => this.result.set(r));
  }

  protected choose(value: string): void {
    this.status.set(value as ApplicationStatus);
  }

  protected title(a: ApplicationSummary): string {
    return a.status === 'Waitlisted' && a.position !== null
      ? `#${a.position} · ${a.child}`
      : a.child;
  }

  protected meta(a: ApplicationSummary): string {
    const parts: (string | null)[] = [a.age !== null ? `${a.age}` : null, appliedByText(a)];
    if (a.status === 'Accepted') {
      parts.push(`placed in ${a.program}${a.reviewedBy ? ' by ' + a.reviewedBy : ''}`);
      if (a.reviewedAt) parts.push(formatDate(a.reviewedAt));
    } else if (a.status === 'Declined') {
      parts.push(a.program, `declined${a.reviewedBy ? ' by ' + a.reviewedBy : ''}`);
      if (a.reviewedAt) parts.push(formatDate(a.reviewedAt));
      if (a.note) parts.push(`“${a.note}”`);
    } else {
      parts.push(a.program, `applied ${formatDate(a.submittedAt)}`);
      if (a.appliedAs === 'Guardian') parts.push(a.returning ? 'returning' : 'new');
    }
    return parts.filter(Boolean).join(' · ');
  }

  protected open(a: ApplicationSummary): boolean {
    return a.status === 'WaitingReview' || a.status === 'Waitlisted';
  }
}
