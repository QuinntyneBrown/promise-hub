import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadResult, Rsvp, SCHEDULE_API, ScheduleSession, YouthSchedule } from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  ToastService,
  formatWhen,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { RsvpDialog } from '../rsvp-dialog/rsvp-dialog';
import { rsvpBadge } from '../rsvp-words';

const DAY = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

/** A day of her schedule: its heading and its sessions. */
interface ScheduleDay {
  day: string;
  heading: string;
  sessions: ScheduleSession[];
}

/**
 * A youth's schedule (mock: youth-schedule, L2-094 criteria 1 and 2): her sessions in the next four weeks by the organization's calendar
 * day, her answer and note, and RSVP or Change RSVP opening the RSVP dialog. A cancelled session offers no RSVP.
 */
@Component({
  selector: 'ph-youth-schedule-page',
  imports: [PhBadge, PhButton, PhCard, PhEmptyState, PhList, PhListItem, PhPageHeader, PhSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './youth-schedule-page.html',
})
export class YouthSchedulePage {
  private readonly api = inject(SCHEDULE_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  protected readonly result = toSignal<LoadResult<YouthSchedule> | null>(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.schedule()),
    ),
    { initialValue: null },
  );
  /** Answers saved in this visit, shown before the schedule reloads. */
  private readonly saved = signal<Record<string, Rsvp>>({});
  protected readonly days = computed<ScheduleDay[]>(() => {
    const r = this.result();
    if (r?.status !== 'loaded') return [];
    const days: ScheduleDay[] = [];
    for (const s of r.value.sessions) {
      const answer = this.saved()[s.eventId];
      const session = answer ? { ...s, response: answer.response, note: answer.note } : s;
      const last = days[days.length - 1];
      if (last?.day === s.day) last.sessions.push(session);
      else
        days.push({
          day: s.day,
          heading: DAY.format(new Date(`${s.day}T12:00:00Z`)).replace(',', ''),
          sessions: [session],
        });
    }
    return days;
  });
  protected readonly badge = rsvpBadge;

  protected meta(s: ScheduleSession): string {
    const when = formatWhen(s.startsAt, s.endsAt).split(', ').slice(1).join(', ');
    return [when, s.place, s.programName].filter(Boolean).join(' · ');
  }

  protected noteText(s: ScheduleSession): string | null {
    return s.note && s.status !== 'Cancelled' ? `Your note: ${s.note}` : null;
  }

  protected reload(): void {
    this.saved.set({});
    this.refresh$.next();
  }

  protected rsvp(session: ScheduleSession): void {
    this.dialogs
      .open<Rsvp | 'closed', ScheduleSession, RsvpDialog>(RsvpDialog, session)
      .closed.subscribe((outcome) => {
        if (outcome === 'closed') {
          this.reload();
        } else if (outcome) {
          this.saved.update((all) => ({ ...all, [session.eventId]: outcome }));
          this.toasts.show({
            tone: 'success',
            title: 'RSVP sent',
            text: `${session.name} · ${rsvpBadge(outcome.response).label}`,
          });
        }
      });
  }
}
