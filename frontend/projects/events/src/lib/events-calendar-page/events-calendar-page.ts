import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EVENTS_API,
  EventCalendar,
  LoadResult,
  PROGRAMS_API,
  SESSION_API,
  can,
} from '@promisehub/api';
import {
  CalendarEntry,
  PhBreadcrumb,
  PhButton,
  PhCalendar,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  SelectOption,
  formatTime,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, map, startWith, switchMap } from 'rxjs';

const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** The month (yyyy-MM) before or after another. */
function shift(month: string, by: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

/** The events calendar (mock: events-calendar): a month of every program's sessions by week, with a program filter (L2-093). */
@Component({
  selector: 'ph-events-calendar-page',
  imports: [
    FormsModule,
    PhBreadcrumb,
    PhButton,
    PhCalendar,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './events-calendar-page.html',
  styleUrl: './events-calendar-page.scss',
})
export class EventsCalendarPage {
  private readonly api = inject(EVENTS_API);
  private readonly router = inject(Router);
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  private readonly refresh$ = new Subject<void>();

  /** Query parameters: the month (yyyy-MM) and the program; empty for the current month and every program. */
  readonly month = input<string | undefined>(undefined);
  readonly programId = input<string | undefined>(undefined);

  protected readonly canCreate = computed(
    () => !!this.session() && can(this.session()!.role, 'manageEvents'),
  );
  protected readonly programOptions = toSignal(
    inject(PROGRAMS_API)
      .list('active')
      .pipe(
        map((r): SelectOption[] => [
          { value: '', label: 'All programs' },
          ...(r.status === 'loaded'
            ? r.value.programs.map((p) => ({ value: p.id, label: p.name }))
            : []),
        ]),
      ),
    { initialValue: [{ value: '', label: 'All programs' }] as SelectOption[] },
  );
  protected readonly result = toSignal<LoadResult<EventCalendar> | null>(
    toObservable(
      computed(() => ({ month: this.month() ?? '', programId: this.programId() ?? '' })),
    ).pipe(
      switchMap((q) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() => this.api.calendar(q.month, q.programId).pipe(startWith(null))),
        ),
      ),
    ),
    { initialValue: null },
  );
  /** The month shown: the server's answer once loaded, else the one asked for. */
  protected readonly shown = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.month : (this.month() ?? '');
  });
  protected readonly title = computed(() => {
    const month = this.shown();
    return month ? MONTH.format(new Date(`${month}-01T12:00:00Z`)) : '';
  });

  protected entries(calendar: EventCalendar): CalendarEntry[] {
    return calendar.events.map((e) => ({
      key: e.id,
      day: e.day,
      time: formatTime(new Date(e.startsAt)),
      label: e.name,
      link: ['/events', e.id],
      cancelled: e.status === 'Cancelled',
    }));
  }

  protected subtitle(calendar: EventCalendar): string {
    const count = calendar.events.length;
    if (count === 0) return 'Nothing scheduled';
    const cancelled = calendar.events.filter((e) => e.status === 'Cancelled').length;
    const sessions = `${count} ${count === 1 ? 'session' : 'sessions'} this month`;
    return cancelled ? `${sessions} · ${cancelled} cancelled` : sessions;
  }

  protected go(by: number): void {
    const month = this.shown();
    if (month) this.navigate({ month: shift(month, by) });
  }

  protected thisMonth(): void {
    this.navigate({ month: null });
  }

  protected setProgram(programId: string): void {
    this.navigate({ programId: programId || null });
  }

  protected reload(): void {
    this.refresh$.next();
  }

  private navigate(queryParams: Record<string, string | null>): void {
    void this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }
}
