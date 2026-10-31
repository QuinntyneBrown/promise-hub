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
  PhAlert,
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhFileUpload,
  PhGuardianShell,
  PhList,
  PhListItem,
  PhSkeleton,
  PhStepMarker,
  PhStepper,
} from '@promisehub/components';
import { guardianBenefitsText } from './guardian-benefits-text';
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
    PhAlert,
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhFileUpload,
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

  protected readonly benefitsWords = computed(() => guardianBenefitsText(this.language()));
  protected readonly offerDismissed = signal(false);
  protected readonly uploading = signal(false);
  protected readonly sending = signal(false);
  protected readonly chosen = signal<string | null>(null);
  protected readonly documentError = signal<string | null>(null);
  protected readonly documentFailed = signal(false);
  protected readonly sentDocument = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.progress(this.token(), this.childId()).subscribe((r) => this.result.set(r));
  }

  /** Not now on the benefits offer is remembered; the offer stays on the guardian page (L2-153 criterion 1). */
  protected dismissOffer(): void {
    this.offerDismissed.set(true);
    this.api.dismissBenefitsOffer(this.token()).subscribe();
  }

  /** Keeps the chosen file encrypted on the server; nothing reaches the provider until Send (L2-150 criterion 6). */
  protected upload(documentId: string, file: File): void {
    this.uploading.set(true);
    this.documentError.set(null);
    this.api.uploadDocument(this.token(), documentId, file).subscribe((r) => {
      this.uploading.set(false);
      if (r.status === 'saved') this.chosen.set(file.name);
      else if (r.status === 'invalid') this.documentError.set(r.errors['file'] ?? null);
      else this.documentFailed.set(true);
    });
  }

  protected send(p: LearningBondProgress, documentId: string, name: string): void {
    if (this.sending()) return;
    this.sending.set(true);
    this.documentFailed.set(false);
    this.api.sendDocument(this.token(), documentId).subscribe((r) => {
      this.sending.set(false);
      if (r.status !== 'sent') {
        this.documentFailed.set(true);
        return;
      }
      this.sentDocument.set(name);
      this.chosen.set(null);
      this.result.set({ status: 'loaded', value: { ...p, document: null } });
    });
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
