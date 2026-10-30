import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LEARNING_BOND_API, LearningBondLaunch } from '@promisehub/api';
import {
  BreadcrumbItem,
  ErrorSummaryItem,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhRadioGroup,
  PhSkeleton,
  PhStat,
  PhTextField,
  RadioOption,
  ToastService,
  formatFullDay,
} from '@promisehub/components';
import { LearningBondCancelLaunchDialog } from './learning-bond-cancel-launch-dialog';

/** Shown beside a disabled Launch when no covered household has a mobile number (L2-140 criterion 2). */
export const NO_PHONE_NUMBERS =
  'Add guardians’ mobile numbers before launching. Staff can collect them at check-in.';

type Mode = 'Scheduled' | 'AtTheDoor';

/**
 * Learning Bond launch (mock: learning-bond-launch, L2-140, ADR 0079): how many covered households there are and how each can be
 * reached, then a day to send at 10:00 in the organization's time zone or Staff invite at the door. A scheduled launch can move or be
 * cancelled until it sends. Counts only; the missing contacts name households, never a number.
 */
@Component({
  selector: 'ph-learning-bond-launch-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhRadioGroup,
    PhSkeleton,
    PhStat,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-launch-page.html',
  styleUrl: './learning-bond-launch-page.css',
})
export class LearningBondLaunchPage {
  private readonly api = inject(LEARNING_BOND_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);

  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Settings', link: '/settings/organization' },
    { label: 'Learning Bond', link: '/settings/learning-bond' },
    { label: 'Launch' },
  ];
  protected readonly noPhoneNumbers = NO_PHONE_NUMBERS;
  protected readonly modes: RadioOption[] = [
    {
      value: 'Scheduled',
      label: 'Send invitations on a day',
      hint: 'At 10:00 am, your organization’s time. Texts count toward the monthly SMS cap; the email fallback applies.',
    },
    {
      value: 'AtTheDoor',
      label: 'Staff invite at the door',
      hint: 'No mass send. Staff tap Invite to Learning Bond on a household at check-in.',
    },
  ];
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly launch = signal<LearningBondLaunch | null>(null);
  protected readonly mode = signal<Mode>('Scheduled');
  protected readonly date = signal('');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly saving = signal(false);
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    (['mode', 'date', 'launch'] as const)
      .filter((f) => this.errors()[f])
      .map((f) => ({
        field: f === 'date' ? 'launch-day' : 'launch-mode',
        message: this.errors()[f]!,
      })),
  );
  /** A scheduled launch waiting for its day: the form moves it. */
  protected readonly pending = computed(() => {
    const l = this.launch();
    return l?.mode === 'Scheduled' && !l.launchedAt;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.launch().subscribe((r) => {
      if (r.status === 'loaded') {
        this.launch.set(r.value);
        this.mode.set(r.value.mode ?? 'Scheduled');
        this.date.set(r.value.date ?? '');
        this.state.set('loaded');
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  protected programsCaption(l: LearningBondLaunch): string {
    return l.programs.join(', ') || 'No program yet';
  }

  protected day(date: string): string {
    return formatFullDay(date);
  }

  protected setMode(value: string): void {
    this.mode.set(value as Mode);
  }

  protected submit(): void {
    if (this.saving()) return;
    this.saving.set(true);
    const mode = this.mode();
    const call = this.pending()
      ? this.api.moveLaunch(this.date())
      : this.api.scheduleLaunch(mode, mode === 'Scheduled' ? this.date() || null : null);
    call.subscribe((outcome) => {
      this.saving.set(false);
      if (outcome.status === 'saved') {
        this.errors.set({});
        this.load();
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.toasts.show({
          tone: 'danger',
          title: 'The launch wasn’t saved',
          text: 'Something went wrong. Try again.',
        });
      }
    });
  }

  /** Cancel the launch? (learning-bond-cancel-launch): nothing is sent. */
  protected cancel(l: LearningBondLaunch): void {
    this.dialogs
      .open<boolean, string, LearningBondCancelLaunchDialog>(
        LearningBondCancelLaunchDialog,
        l.date ? this.day(l.date) : '',
      )
      .closed.subscribe((cancelled) => {
        if (!cancelled) return;
        this.toasts.show({
          tone: 'info',
          title: 'Launch cancelled',
          text: 'Nothing was sent. Schedule a new day when you’re ready.',
        });
        this.load();
      });
  }
}
