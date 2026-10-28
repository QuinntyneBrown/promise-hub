import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  ATTENDANCE_API,
  LoadResult,
  ModuleId,
  PARTICIPANT_ROLES,
  SESSION_API,
  Session,
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
  /** Youth, mentors and volunteers get a welcome and their own work, never the staff summary (ADR 0043). */
  protected readonly participant = computed(() => {
    const s = this.session();
    return !!s && PARTICIPANT_ROLES.includes(s.role);
  });
  protected readonly today = dateFormat.format(new Date());
  /** Only fetched while Roll Call is on, so nothing of an off module is requested. */
  protected readonly sessions = toSignal(
    toObservable(this.session).pipe(
      switchMap((s) =>
        s?.modules.includes('RollCall') && TodayPage.runsSessions(s)
          ? this.attendance
              .today()
              .pipe(map((r) => (r.status === 'loaded' ? r.value.sessions : [])))
          : of(s ? [] : null),
      ),
    ),
    { initialValue: null as SessionSummary[] | null },
  );
  /** A volunteer's sessions today (L2-100): only while Roll Call is on; null while loading. */
  protected readonly volunteer = computed(() => this.session()?.role === 'Volunteer');
  private readonly retry$ = new Subject<void>();
  protected readonly mySessions = toSignal<LoadResult<{ sessions: SessionSummary[] }> | null>(
    toObservable(this.session).pipe(
      switchMap((s) =>
        s?.role === 'Volunteer' && s.modules.includes('RollCall')
          ? this.retry$.pipe(
              startWith(undefined),
              switchMap(() => this.attendance.today().pipe(startWith(null))),
            )
          : of(null),
      ),
    ),
    { initialValue: null },
  );
  /** Null while loading; only fetched while Roster is on. */
  protected readonly summary = toSignal<LoadResult<TodaySummary> | null>(
    toObservable(this.session).pipe(
      switchMap((s) =>
        s?.modules.includes('Roster') && !PARTICIPANT_ROLES.includes(s.role)
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

  /** Staff have the session summary; participant roles never ask for it here (a volunteer's cards load separately). */
  private static runsSessions(s: Session): boolean {
    return !PARTICIPANT_ROLES.includes(s.role);
  }

  /** A participant's work: one item per module that is on and serves the role (L2-038 criteria 6 and 7). */
  protected readonly work = computed(() => {
    const s = this.session();
    if (!s) return [];
    const items: { title: string; meta: string; link: string }[] = [];
    if (s.role === 'Youth' && s.modules.includes('Learning')) {
      items.push({
        title: 'Learning',
        meta: 'Your lessons, quizzes and badges',
        link: '/learning',
      });
    }
    if (s.role === 'Mentor' && s.modules.includes('Mentoring')) {
      items.push({ title: 'Mentoring', meta: 'The youth assigned to you', link: '/mentoring' });
    }
    // Mentors take attendance for their cohorts' sessions in Roll Call (L2-095, ADR 0065).
    if (s.role === 'Mentor' && s.modules.includes('RollCall')) {
      items.push({
        title: 'Check-in',
        meta: 'Take attendance for your cohorts’ sessions today',
        link: '/check-in',
      });
    }
    // A volunteer's own schedule (L2-101), beside today's session cards.
    if (s.role === 'Volunteer' && s.modules.includes('RollCall')) {
      items.push({
        title: 'Your schedule',
        meta: 'The sessions you’re assigned to in the next four weeks',
        link: '/my-schedule',
      });
    }
    return items;
  });

  protected reload(): void {
    this.refresh$.next();
  }

  protected retry(): void {
    this.retry$.next();
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
        return this.has('Roster') ? '/applications' : null;
      case 'pickups':
        return '/check-in';
    }
  }

  protected unsigned(s: TodaySummary): string {
    return String((s.slipsDue ?? []).reduce((n, x) => n + x.unsigned, 0));
  }
}
