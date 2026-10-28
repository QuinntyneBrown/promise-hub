import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ANNOUNCEMENTS_API,
  AnnouncementList,
  AnnouncementRow,
  LoadResult,
  PROGRAMS_API,
} from '@promisehub/api';
import {
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhStat,
  SelectOption,
  ToastService,
  formatDay,
  formatTime,
} from '@promisehub/components';
import { Subject, map, startWith, switchMap } from 'rxjs';
import { AUDIENCE_LABEL } from '../audience-words';
import { ComposeAnnouncementData } from '../compose-announcement-data';
import { ComposeAnnouncementDialog } from '../compose-announcement-dialog/compose-announcement-dialog';
import { ComposeAnnouncementResult } from '../compose-announcement-result';

/**
 * Announcements for staff (mock: announcements, L2-105 criterion 7): newest first, with the program, who hears it, when, who sent it, how
 * many youth and mentors have read it and how many households were texted. New announcement opens compose-announcement.
 */
@Component({
  selector: 'ph-announcements-page',
  imports: [
    PhBadge,
    PhBreadcrumb,
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
  templateUrl: './announcements-page.html',
})
export class AnnouncementsPage {
  private readonly api = inject(ANNOUNCEMENTS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<AnnouncementList> | null>(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.list().pipe(startWith<LoadResult<AnnouncementList> | null>(null))),
    ),
    { initialValue: null },
  );

  private readonly programs = toSignal(
    inject(PROGRAMS_API)
      .list('active')
      .pipe(
        map((r): SelectOption[] =>
          r.status === 'loaded'
            ? r.value.programs.map((p) => ({ value: p.id, label: p.name }))
            : [],
        ),
      ),
    { initialValue: [] as SelectOption[] },
  );

  protected readonly sentCount = computed(() => {
    const r = this.result();
    if (r?.status !== 'loaded') return { sent: 0, scheduled: 0 };
    const rows = r.value.announcements;
    return {
      sent: rows.filter((a) => a.status === 'Sent').length,
      scheduled: rows.filter((a) => a.status === 'Scheduled').length,
    };
  });

  protected readonly readTotals = computed(() => {
    const r = this.result();
    const rows =
      r?.status === 'loaded' ? r.value.announcements.filter((a) => a.status === 'Sent') : [];
    const reached = rows.reduce((n, a) => n + a.recipients, 0);
    const read = rows.reduce((n, a) => n + a.reads, 0);
    return { reached, read, percent: reached ? Math.round((100 * read) / reached) : 0 };
  });

  protected audience(a: AnnouncementRow): string {
    return `${a.program ?? 'All programs'} · ${AUDIENCE_LABEL[a.audience]}`;
  }

  protected caption(a: AnnouncementRow): string {
    if (a.status === 'Scheduled') return `Sends ${this.when(a.sendAt)}`;
    const parts = [`${formatDay(a.sendAt)} · ${a.sentBy}`];
    if (a.households) parts.push(`${a.households} households texted`);
    return parts.join(' · ');
  }

  /** "Fri 6 Nov, 9:00 am". */
  private when(iso: string): string {
    return `${formatDay(iso)}, ${formatTime(new Date(iso))}`;
  }

  protected compose(): void {
    this.dialogs
      .open<ComposeAnnouncementResult, ComposeAnnouncementData, ComposeAnnouncementDialog>(
        ComposeAnnouncementDialog,
        { programs: this.programs() },
      )
      .closed.subscribe((result) => {
        if (!result) return;
        this.toasts.show(
          result.scheduledFor
            ? {
                tone: 'success',
                title: 'Announcement scheduled',
                text: `Sends ${this.when(result.scheduledFor)}`,
              }
            : { tone: 'success', title: 'Announcement sent', text: result.title },
        );
        this.refresh$.next();
      });
  }

  protected load(): void {
    this.refresh$.next();
  }
}
