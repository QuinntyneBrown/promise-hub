import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AssignedWorkResult,
  LoadResult,
  MENTORING_API,
  MentorActivity,
  MentorCheckInDue,
  MentorDashboard,
  MentorFollowUp,
  MentoredYouth,
  SESSION_API,
} from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhInlineMessage,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhStat,
  PhTimeline,
  TimelineEntry,
  ToastService,
  formatDateTime,
  formatDay,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, filter, map, of, startWith, switchMap } from 'rxjs';
import { AssignWorkDialog } from '../assign-work-dialog/assign-work-dialog';

const SHOWN = 5;
const VERBS: Record<MentorActivity['kind'], string> = {
  CheckedIn: 'checked in to',
  SignedOut: 'was signed out of',
  Absent: 'was marked absent from',
};

/**
 * Mentoring, the mentor dashboard (mock: mentor-dashboard, L2-063). Every number and row comes from the server, scoped to the youth and
 * cohorts assigned to the signed-in mentor; attendance renders only when the server sends it (Roll Call on).
 */
@Component({
  selector: 'ph-mentor-dashboard-page',
  imports: [
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhInlineMessage,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhStat,
    PhTimeline,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentor-dashboard-page.html',
})
export class MentorDashboardPage {
  private readonly api = inject(MENTORING_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  protected readonly subtitle = computed(() => {
    const first = this.session()?.personName.split(' ')[0];
    return first
      ? `Welcome back, ${first}. Here’s how your youth are doing.`
      : 'Here’s how your youth are doing.';
  });

  /** Assign work and Reviews need Learning content (L2-092 criterion 6, L2-080). */
  protected readonly learningOn = computed(
    () => this.session()?.modules.includes('Learning') ?? false,
  );

  /** How many reviews wait, or null while Learning is off or before it loads (L2-080 criterion 1). */
  protected readonly reviewsWaiting = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(
        filter((session) => session.modules.includes('Learning')),
        switchMap(() => this.api.reviews()),
        map((r) => (r.status === 'loaded' ? r.value.items.length : null)),
        catchError(() => of(null)),
      ),
    { initialValue: null },
  );

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() =>
        this.api.dashboard().pipe(startWith<LoadResult<MentorDashboard> | null>(null)),
      ),
    ),
    { initialValue: null },
  );

  protected shown(d: MentorDashboard): MentoredYouth[] {
    return d.youth.slice(0, SHOWN);
  }

  protected youthMeta(y: MentoredYouth): string {
    return [y.age !== null ? `Age ${y.age}` : null, y.programs.join(', ') || null]
      .filter(Boolean)
      .join(' · ');
  }

  protected followUpMeta(f: MentorFollowUp): string {
    return `${f.overdue ? 'Overdue · ' : ''}${formatDay(f.followUpOn)}`;
  }

  protected checkInDueMeta(c: MentorCheckInDue): string {
    return c.lastCheckIn
      ? `Last mentor check-in ${formatDay(c.lastCheckIn)}`
      : 'No mentor check-in yet';
  }

  protected leads(d: MentorDashboard): number {
    return d.cohorts.filter((c) => c.role === 'Lead').length;
  }

  protected entries(activity: MentorActivity[]): TimelineEntry[] {
    return activity.map((a, i) => ({
      key: `${a.childId}-${i}`,
      actor: a.youthName,
      text: `${VERBS[a.kind]} ${a.session}`,
      meta: formatDateTime(a.at),
    }));
  }

  /** Opens Assign work; once assigned, a toast says to how many youth and when it is due (L2-092 criterion 2). */
  protected assign(): void {
    this.dialogs
      .open<AssignedWorkResult, undefined, AssignWorkDialog>(AssignWorkDialog)
      .closed.subscribe((assigned) => {
        if (!assigned) return;
        this.toasts.show({
          tone: 'success',
          title: 'Work assigned',
          text: `${assigned.title} · ${assigned.count} youth · Due ${formatDay(assigned.dueOn)}`,
        });
      });
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
