import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NOTIFICATION_PREFERENCES_API, NotificationPreference } from '@promisehub/api';
import {
  BreadcrumbItem,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhSkeleton,
  PhSwitch,
  ToastService,
} from '@promisehub/components';

/**
 * Your account › Notifications (mock: account-notifications, L2-111): one switch per kind the member's role receives whose module is on,
 * each with what it covers, and Save changes. A failed save keeps the switches as they are.
 */
@Component({
  selector: 'ph-notification-preferences-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhSkeleton,
    PhSwitch,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notification-preferences-page.html',
})
export class NotificationPreferencesPage {
  private readonly api = inject(NOTIFICATION_PREFERENCES_API);
  private readonly toasts = inject(ToastService);

  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Your account', link: '/account' },
    { label: 'Notifications' },
  ];
  protected readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly kinds = signal<NotificationPreference[]>([]);
  protected readonly saving = signal(false);
  protected readonly failed = signal(false);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.load().subscribe((r) => {
      if (r.status === 'loaded') {
        this.kinds.set(r.value);
        this.state.set('loaded');
      } else {
        this.state.set('error');
      }
    });
  }

  protected change(key: string, inApp: boolean): void {
    this.kinds.update((list) => list.map((k) => (k.key === key ? { ...k, inApp } : k)));
  }

  protected save(): void {
    this.saving.set(true);
    this.failed.set(false);
    this.api
      .save(this.kinds().map((k) => ({ key: k.key, inApp: k.inApp })))
      .subscribe((outcome) => {
        this.saving.set(false);
        if (outcome.status === 'saved') {
          this.toasts.show({ tone: 'success', title: 'Notification preferences saved' });
        } else {
          this.failed.set(true);
        }
      });
  }
}
