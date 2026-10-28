import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ATTENDANCE_API, LoadResult, MySchedule, MySession } from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  formatWhen,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

const DAY = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/** A day of the schedule: its heading and its sessions. */
interface ScheduleDay {
  day: string;
  heading: string;
  sessions: MySession[];
}

/**
 * A volunteer's schedule (mock: my-schedule, L2-101): the sessions he is assigned to in the next four weeks by the organization's
 * calendar day, each marked Today (with Take attendance), Assigned or Cancelled.
 */
@Component({
  selector: 'ph-my-schedule-page',
  imports: [PhBadge, PhButton, PhCard, PhEmptyState, PhList, PhListItem, PhPageHeader, PhSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-schedule-page.html',
})
export class MySchedulePage {
  private readonly api = inject(ATTENDANCE_API);
  private readonly refresh$ = new Subject<void>();

  protected readonly result = toSignal<LoadResult<MySchedule> | null>(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.mine().pipe(startWith(null))),
    ),
    { initialValue: null },
  );
  protected readonly days = computed<ScheduleDay[]>(() => {
    const r = this.result();
    if (r?.status !== 'loaded') return [];
    const days: ScheduleDay[] = [];
    for (const s of r.value.sessions) {
      const last = days[days.length - 1];
      if (last?.day === s.day) last.sessions.push(s);
      else
        days.push({
          day: s.day,
          heading: DAY.format(new Date(`${s.day}T12:00:00Z`)).replace(',', ''),
          sessions: [s],
        });
    }
    return days;
  });

  protected meta(s: MySession): string {
    const when = formatWhen(s.startsAt, s.endsAt).split(', ').slice(1).join(', ');
    return [when, s.place, s.programName, `${s.expected} youth`].filter(Boolean).join(' · ');
  }

  /** Today's session that is still on offers Take attendance. */
  protected takesAttendance(s: MySession): boolean {
    return s.today && s.status === 'Scheduled';
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
