import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AppNotification,
  LoadResult,
  NOTIFICATIONS_API,
  NotificationList,
  REALTIME_EVENTS,
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
  formatDateTime,
} from '@promisehub/components';
import { Subject, filter, map, merge, startWith, switchMap } from 'rxjs';
import { NOTIFICATION_KIND_LABELS } from './notification-kind-label';

/**
 * The notification center (mock: notifications, L2-040, L2-109): every member's own notices, newest first, each with its kind, New while
 * unread, and Mark all read.
 */
@Component({
  selector: 'ph-notifications-page',
  imports: [PhBadge, PhButton, PhCard, PhEmptyState, PhList, PhListItem, PhPageHeader, PhSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications-page.html',
})
export class NotificationsPage {
  private readonly api = inject(NOTIFICATIONS_API);
  private readonly refresh$ = new Subject<void>();

  /** A new notice, a read elsewhere or a (re)connected stream fetches the list again without the loading state (L2-110). */
  private readonly quiet$ = inject(REALTIME_EVENTS)
    .events()
    .pipe(filter((e) => e.type === 'notification' || e.type === 'open'));

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<NotificationList> | null>(
    merge(
      this.refresh$.pipe(
        startWith(undefined),
        map(() => true),
      ),
      this.quiet$.pipe(map(() => false)),
    ).pipe(
      switchMap((loud) =>
        loud
          ? this.api.list().pipe(startWith<LoadResult<NotificationList> | null>(null))
          : this.api.list().pipe(filter((r) => r.status === 'loaded')),
      ),
    ),
    { initialValue: null },
  );
  protected readonly list = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });

  protected reload(): void {
    this.refresh$.next();
  }

  protected subtitle(l: NotificationList): string {
    return l.unread ? `${l.unread} unread` : 'All read';
  }

  protected meta(n: AppNotification): string {
    const kind = NOTIFICATION_KIND_LABELS[n.kind];
    return (kind ? `${kind} · ` : '') + formatDateTime(n.createdAt) + (n.readAt ? '' : ' · Unread');
  }

  /** Opening a notice marks it read; the link then navigates. */
  protected opened(n: AppNotification): void {
    if (!n.readAt) this.api.read(n.id).subscribe();
  }

  protected markAllRead(): void {
    this.api.readAll().subscribe(() => this.reload());
  }
}
