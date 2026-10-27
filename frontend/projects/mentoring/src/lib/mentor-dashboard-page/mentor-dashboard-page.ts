import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  LoadResult,
  MENTORING_API,
  MentorActivity,
  MentorDashboard,
  MentoredYouth,
  SESSION_API,
} from '@promisehub/api';
import {
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhStat,
  PhTimeline,
  TimelineEntry,
  formatDateTime,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, startWith, switchMap } from 'rxjs';

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
    PhButton,
    PhCard,
    PhEmptyState,
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

  protected reload(): void {
    this.refresh$.next();
  }
}
