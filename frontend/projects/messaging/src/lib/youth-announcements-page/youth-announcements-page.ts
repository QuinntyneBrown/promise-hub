import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ANNOUNCEMENTS_API, LoadResult, MyAnnouncement, MyAnnouncements } from '@promisehub/api';
import {
  PhAlert,
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  ToastService,
  formatDay,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

/**
 * A youth's or mentor's announcements (mock: youth-announcements, L2-105 criteria 5 and 6): newest first with who sent them, New on the
 * unread, and Mark all read.
 */
@Component({
  selector: 'ph-youth-announcements-page',
  imports: [
    PhAlert,
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './youth-announcements-page.html',
})
export class YouthAnnouncementsPage {
  private readonly api = inject(ANNOUNCEMENTS_API);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<MyAnnouncements> | null>(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.mine().pipe(startWith<LoadResult<MyAnnouncements> | null>(null))),
    ),
    { initialValue: null },
  );

  protected readonly unread = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.unread : 0;
  });
  protected readonly busy = signal(false);
  protected readonly markFailed = signal(false);

  protected caption(a: MyAnnouncement): string {
    return [`${a.from} · ${a.fromRole}`, formatDay(a.sentAt), a.program ?? 'All programs'].join(
      ' · ',
    );
  }

  protected markAllRead(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.markFailed.set(false);
    this.api.markAllRead().subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: 'All caught up',
          text: 'Every announcement is marked read.',
        });
        this.refresh$.next();
      } else {
        this.markFailed.set(true);
      }
    });
  }

  protected load(): void {
    this.refresh$.next();
  }
}
