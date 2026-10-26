import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppNotification, LoadResult, NOTIFICATIONS_API, NotificationList } from '@promisehub/api';
import {
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  formatDateTime,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

/** The notification center (mock: notifications): the caller's notices, newest first, with Mark all read. */
@Component({
  selector: 'ph-notifications-page',
  imports: [PhButton, PhCard, PhEmptyState, PhList, PhListItem, PhPageHeader, PhSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications-page.html',
})
export class NotificationsPage {
  private readonly api = inject(NOTIFICATIONS_API);
  private readonly refresh$ = new Subject<void>();

  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.list().pipe(startWith<LoadResult<NotificationList> | null>(null))),
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
    return formatDateTime(n.createdAt) + (n.readAt ? '' : ' · Unread');
  }

  /** Opening a notice marks it read; the link then navigates. */
  protected opened(n: AppNotification): void {
    if (!n.readAt) this.api.read(n.id).subscribe();
  }

  protected markAllRead(): void {
    this.api.readAll().subscribe(() => this.reload());
  }
}
