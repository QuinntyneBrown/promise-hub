import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { GuardianPageResult, LEARNING_BOND_API, LearningBondProgress } from '@promisehub/api';
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
  PhStepMarker,
  PhStepper,
} from '@promisehub/components';
import { guardianLearningBondText } from './guardian-learning-bond-text';
import { LearningBondApplicationRow } from './learning-bond-application-row';
import { learningBondApplicationRows } from './learning-bond-application-rows';

/** One of the three steps after Submit. */
interface NextStep {
  title: string;
  meta: string;
  done: boolean;
}

/**
 * After Submit (learning-bond-submitted, L2-150 criterion 1): where the application went and when, what happens next in three steps with the
 * expected deposit window, and what was sent with the SINs masked. Before Submit it says so and links back to the review.
 */
@Component({
  selector: 'ph-learning-bond-submitted-page',
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
    PhStepMarker,
    PhStepper,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-submitted-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondSubmittedPage implements OnInit {
  private readonly api = inject(LEARNING_BOND_API);

  readonly token = input.required<string>();
  readonly childId = input.required<string>();

  protected readonly result = signal<GuardianPageResult<LearningBondProgress | null> | null>(null);
  protected readonly language = computed(() => {
    const r = this.result();
    return r?.status === 'loaded'
      ? (r.value?.language ?? 'en')
      : r?.status === 'verify'
        ? r.language
        : 'en';
  });
  protected readonly text = computed(() => guardianLearningBondText(this.language()));
  protected readonly organization = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value?.organization ?? null;
    return r?.status === 'verify' || r?.status === 'gone' ? r.organization : null;
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.progress(this.token(), this.childId()).subscribe((r) => this.result.set(r));
  }

  protected sentOn(p: LearningBondProgress): string {
    const t = this.text();
    const day = new Intl.DateTimeFormat(t.locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Toronto',
    });
    return t.sentHeading(p.provider, day.format(new Date(p.submittedAt)).replace(',', ''));
  }

  /** "Expected Jan 15 – Feb 28, 2027": the provider's window, in the guardian's language. */
  protected window(p: LearningBondProgress): string {
    const t = this.text();
    const short = new Intl.DateTimeFormat(t.locale === 'en-GB' ? 'en-US' : t.locale, {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
    const year = p.expectedTo.slice(0, 4);
    const from = short.format(new Date(`${p.expectedFrom}T12:00:00Z`));
    const to = short.format(new Date(`${p.expectedTo}T12:00:00Z`));
    return t.locale === 'en-GB'
      ? `${t.expected(from, to)}, ${year}`
      : `${t.expected(from, to)} ${year}`;
  }

  protected steps(p: LearningBondProgress): NextStep[] {
    const t = this.text();
    return [
      {
        title: t.nextStep1(p.provider, p.firstName),
        meta: t.nextStep1Meta,
        done: p.stepsDone >= 1,
      },
      { title: t.nextStep2, meta: t.nextStep2Meta, done: p.stepsDone >= 2 },
      { title: t.nextStep3(p.firstName), meta: t.nextStep3Meta, done: p.stepsDone >= 3 },
    ];
  }

  protected rows(p: LearningBondProgress): LearningBondApplicationRow[] {
    return learningBondApplicationRows(this.text(), p.firstName, p.fields);
  }
}
