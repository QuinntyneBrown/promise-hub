import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NOTIFICATION_SETTINGS_API, SESSION_API, settingsSections } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhButton,
  PhCard,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhSkeleton,
  PhSwitch,
  PhTabs,
  PhTextField,
  ToastService,
} from '@promisehub/components';

const ORDER = ['noShowDelayMinutes', 'smsCap'];

/** Settings › Notifications (mock: settings-notifications): no-show delay, supervisor emails and the SMS cap. */
@Component({
  selector: 'ph-settings-notifications-page',
  imports: [
    FormsModule,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhSkeleton,
    PhSwitch,
    PhTabs,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-notifications-page.html',
  styleUrl: './settings-notifications-page.css',
})
export class SettingsNotificationsPage {
  private readonly api = inject(NOTIFICATION_SETTINGS_API);
  private readonly toasts = inject(ToastService);

  protected readonly sections = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(map((s) => settingsSections(s.modules))),
    { initialValue: settingsSections([]) },
  );
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly delay = signal('15');
  protected readonly emails = signal(true);
  protected readonly cap = signal('0');
  protected readonly used = signal(0);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly saving = signal(false);
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    ORDER.filter((f) => this.errors()[f]).map((field) => ({
      field,
      message: this.errors()[field]!,
    })),
  );
  protected readonly usedHelp = computed(
    () => `Used: ${this.used().toLocaleString('en-US')} this month. At the cap, texts pause.`,
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.load().subscribe((r) => {
      if (r.status === 'loaded') {
        this.delay.set(String(r.value.noShowDelayMinutes));
        this.emails.set(r.value.emailSupervisorsOnIncidents);
        this.cap.set(String(r.value.smsCap));
        this.used.set(r.value.smsUsed);
        this.state.set('loaded');
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.api
      .save({
        noShowDelayMinutes: Number(this.delay()),
        emailSupervisorsOnIncidents: this.emails(),
        smsCap: Number(this.cap()),
      })
      .subscribe((outcome) => {
        this.saving.set(false);
        switch (outcome.status) {
          case 'saved':
            this.errors.set({});
            this.toasts.show({ tone: 'success', title: 'Notification settings saved' });
            break;
          case 'invalid':
            this.errors.set(outcome.errors);
            break;
          case 'forbidden':
            this.state.set('forbidden');
            break;
          default:
            this.toasts.show({
              tone: 'danger',
              title: 'Notification settings not saved',
              text: 'Something went wrong. Try again.',
            });
        }
      });
  }
}
