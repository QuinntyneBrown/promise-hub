import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GuardianPageResult, LEARNING_BOND_API, LearningBondPaused } from '@promisehub/api';
import {
  PhAgentMessage,
  PhAlert,
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhGuardianShell,
  PhRadioGroup,
  PhSkeleton,
  RadioOption,
} from '@promisehub/components';
import { guardianLearningBondText } from './guardian-learning-bond-text';

/**
 * A paused claim (learning-bond-paused, L2-151): why it waits, the government page that helps, reminders at 14 and 30 days, and where it
 * picks up again with every answer kept.
 */
@Component({
  selector: 'ph-learning-bond-paused-page',
  imports: [
    FormsModule,
    PhAgentMessage,
    PhAlert,
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhGuardianShell,
    PhRadioGroup,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-paused-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondPausedPage implements OnInit {
  private readonly api = inject(LEARNING_BOND_API);

  readonly token = input.required<string>();
  readonly childId = input.required<string>();

  protected readonly result = signal<GuardianPageResult<LearningBondPaused> | null>(null);
  protected readonly language = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.language : r?.status === 'verify' ? r.language : 'en';
  });
  protected readonly text = computed(() => guardianLearningBondText(this.language()));
  protected readonly organization = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value.organization;
    return r?.status === 'verify' || r?.status === 'gone' ? r.organization : null;
  });
  protected readonly options = computed<RadioOption[]>(() => {
    const t = this.text();
    return [
      { value: 'yes', label: t.remindYes, hint: t.remindYesHint },
      { value: 'no', label: t.remindNo },
    ];
  });

  protected remind = '';
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.paused(this.token(), this.childId()).subscribe((r) => this.result.set(r));
  }

  protected save(): void {
    if (this.busy() || !this.remind) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api.setReminder(this.token(), this.childId(), this.remind === 'yes').subscribe((p) => {
      this.busy.set(false);
      if (p) this.result.set({ status: 'loaded', value: p });
      else this.failed.set(true);
    });
  }

  /** "Thu 19 Nov": a reminder's day in the guardian's language. */
  protected day(date: string): string {
    const t = this.text();
    return new Intl.DateTimeFormat(t.locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })
      .format(new Date(`${date}T12:00:00Z`))
      .replace(',', '');
  }
}
