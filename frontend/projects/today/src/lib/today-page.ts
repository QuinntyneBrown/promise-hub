import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  ATTENDANCE_API,
  LoadResult,
  ModuleId,
  SESSION_API,
  SessionSummary,
  TODAY_API,
  TodaySummary,
  TodayTask,
} from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhStat,
  formatDate,
  formatDateTime,
  formatWhen,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, map, of, startWith, switchMap } from 'rxjs';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Today, the staff home (mock: today): tonight's sessions when Roll Call is on, then the roster counts, slips due,
 * what is coming up and the work waiting, each composed only from modules that are on.
 */
@Component({
  selector: 'ph-today-page',
  imports: [
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhStat,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-page.html',
  styleUrl: './today-page.scss',
})
export class TodayPage {
  private readonly attendance = inject(ATTENDANCE_API);
  private readonly todayApi = inject(TODAY_API);
  private readonly refresh$ = new Subject<void>();

  // The shell shows the server error page when the session cannot load.
  protected readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  protected readonly firstName = computed(() => this.session()?.personName.split(' ')[0] ?? '');
  protected readonly today = dateFormat.format(new Date());
  /** Only fetched while Roll Call is on, so nothing of an off module is requested. */
  protected readonly sessions = toSignal(
    toObservable(this.session).pipe(
      switchMap((s) =>
        s?.modules.includes('RollCall')
          ? this.attendance
              .today()
              .pipe(map((r) => (r.status === 'loaded' ? r.value.sessions : [])))
          : of(s ? [] : null),
      ),
    ),
    { initialValue: null as SessionSummary[] | null },
  );
  /** Null while loading; only fetched while Roster is on. */
  protected readonly summary = toSignal<LoadResult<TodaySummary> | null>(
    toObservable(this.session).pipe(
      switchMap((s) =>
        s?.modules.includes('Roster')
          ? this.refresh$.pipe(
              startWith(undefined),
              switchMap(() => this.todayApi.summary().pipe(startWith(null))),
            )
          : of(null),
      ),
    ),
    { initialValue: null },
  );
  protected readonly when = formatWhen;
  protected readonly date = formatDate;
  protected readonly dateTime = formatDateTime;

  protected reload(): void {
    this.refresh$.next();
  }

  protected has(module: ModuleId): boolean {
    return !!this.session()?.modules.includes(module);
  }

  protected taskTitle(t: TodayTask): string {
    const one = t.count === 1;
    switch (t.kind) {
      case 'incidents':
        return `${t.count} ${one ? 'incident' : 'incidents'} to review`;
      case 'enrollments':
        return `${t.count} ${one ? 'enrollment' : 'enrollments'} to review`;
      case 'pickups':
        return `${t.count} pickup ${one ? 'request' : 'requests'} waiting`;
    }
  }

  /** Where a count leads; null when that screen's module is off. */
  protected taskLink(t: TodayTask): string | null {
    switch (t.kind) {
      case 'incidents':
        return '/incidents';
      case 'enrollments':
        return this.has('Slips') ? '/programs' : null;
      case 'pickups':
        return '/check-in';
    }
  }

  protected unsigned(s: TodaySummary): string {
    return String((s.slipsDue ?? []).reduce((n, x) => n + x.unsigned, 0));
  }
}
