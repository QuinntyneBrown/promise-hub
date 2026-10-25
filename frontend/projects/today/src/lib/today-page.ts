import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ATTENDANCE_API, SESSION_API, SessionSummary } from '@promisehub/api';
import { PhButton, PhCard, PhEmptyState, PhPageHeader, formatWhen } from '@promisehub/components';
import { EMPTY, catchError, map, of, switchMap } from 'rxjs';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Today, the staff home (mock: today): tonight's sessions when Roll Call is on, otherwise the empty state. */
@Component({
  selector: 'ph-today-page',
  imports: [PhButton, PhCard, PhEmptyState, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-page.html',
  styleUrl: './today-page.scss',
})
export class TodayPage {
  private readonly attendance = inject(ATTENDANCE_API);

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
  protected readonly when = formatWhen;
}
