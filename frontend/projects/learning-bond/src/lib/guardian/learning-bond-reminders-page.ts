import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  GuardianPageResult,
  LEARNING_BOND_API,
  LearningBondDateReminder,
  LearningBondReminders,
} from '@promisehub/api';
import {
  PhAgentMessage,
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhGuardianShell,
  PhList,
  PhListItem,
  PhSkeleton,
} from '@promisehub/components';
import { guardianBenefitsText } from './guardian-benefits-text';
import { guardianLearningBondText } from './guardian-learning-bond-text';

/** The household's reminders (learning-bond-reminders, L2-157): each date that matters with Turn off; none before a benefits check. */
@Component({
  selector: 'ph-learning-bond-reminders-page',
  imports: [
    PhAgentMessage,
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhGuardianShell,
    PhList,
    PhListItem,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-reminders-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondRemindersPage implements OnInit {
  protected readonly api = inject(LEARNING_BOND_API);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<LearningBondReminders> | null>(null);
  protected readonly language = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.language : r?.status === 'verify' ? r.language : 'en';
  });
  protected readonly text = computed(() => guardianLearningBondText(this.language()));
  protected readonly words = computed(() => guardianBenefitsText(this.language()));
  protected readonly organization = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value.organization;
    return r?.status === 'verify' || r?.status === 'gone' ? r.organization : null;
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.reminders(this.token()).subscribe((r) => this.result.set(r));
  }

  protected title(r: LearningBondDateReminder): string {
    return this.words().reminderTitle(r.kind, r.subject);
  }

  protected when(r: LearningBondDateReminder): string {
    const day = new Intl.DateTimeFormat(this.text().locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
      .format(
        new Date(`${r.kind === 'Taxes' || r.kind === 'Renewal' ? r.dueOn : r.eventOn}T12:00:00Z`),
      )
      .replace(',', '');
    return this.words().reminderWhen(r.kind, day);
  }

  /** Turned off, it is never sent (L2-157 criterion 3). */
  protected turnOff(page: LearningBondReminders, r: LearningBondDateReminder): void {
    this.api.turnOffReminder(this.token(), r.id).subscribe((done) => {
      if (done.status !== 'saved') return;
      this.result.set({
        status: 'loaded',
        value: {
          ...page,
          reminders: page.reminders.map((x) => (x.id === r.id ? { ...x, turnedOff: true } : x)),
        },
      });
    });
  }
}
