import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { GuardianPageResult, LEARNING_BOND_API, Benefits } from '@promisehub/api';
import { BenefitItem } from '@promisehub/api';
import {
  PhAgentMessage,
  PhAlert,
  PhBadge,
  PhBenefitCard,
  PhButton,
  PhCard,
  PhEmptyState,
  PhFileUpload,
  PhGuardianShell,
  PhList,
  PhListItem,
  PhSkeleton,
} from '@promisehub/components';
import { guardianBenefitsText } from './guardian-benefits-text';
import { guardianLearningBondText } from './guardian-learning-bond-text';

/** The family’s benefits (L2-155, L2-156): each with exactly one state as a benefit card, the notes, and You already get these; no Submit all. */
@Component({
  selector: 'ph-learning-bond-benefits-page',
  imports: [
    PhAgentMessage,
    PhAlert,
    PhBadge,
    PhBenefitCard,
    PhButton,
    PhCard,
    PhEmptyState,
    PhFileUpload,
    PhGuardianShell,
    PhList,
    PhListItem,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-benefits-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondBenefitsPage implements OnInit {
  protected readonly api = inject(LEARNING_BOND_API);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<Benefits> | null>(null);
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
    this.api.benefits(this.token()).subscribe((r) => this.result.set(r));
  }

  protected readonly uploadError = signal<Record<string, string>>({});
  protected readonly uploading = signal<string | null>(null);

  protected open(b: BenefitItem): boolean {
    return b.state !== 'AlreadyGet';
  }

  protected already(items: BenefitItem[]): BenefitItem[] {
    return items.filter((b) => b.state === 'AlreadyGet');
  }

  protected tone(b: BenefitItem): 'success' | 'warning' | 'neutral' | 'info' {
    return b.state === 'ApplyNow'
      ? 'success'
      : b.state === 'NeedDocument'
        ? 'warning'
        : b.state === 'Submitted'
          ? 'info'
          : 'neutral';
  }

  protected amount(b: BenefitItem): string {
    return b.amount === null
      ? this.words().varies
      : this.words().yearly(this.text().amount(b.amount));
  }

  protected line(b: BenefitItem): string | null {
    const w = this.words();
    if (b.state === 'NotEligible') return b.reason;
    if (b.state === 'NeedDocument' && b.document) return w.needs(b.name, b.document);
    if (b.document && b.documentFile) return w.attached(b.document, b.documentFile);
    return null;
  }

  /** The document a program needs: kept encrypted with this benefit's application, sent only with it (L2-156 criterion 5). */
  protected upload(b: BenefitItem, file: File): void {
    this.uploading.set(b.key);
    this.uploadError.set({});
    this.api.uploadBenefitDocument(this.token(), b.key, file).subscribe((r) => {
      this.uploading.set(null);
      if (r.status === 'saved') this.load();
      else if (r.status === 'invalid') this.uploadError.set({ [b.key]: r.errors['file'] ?? '' });
      else this.uploadError.set({ [b.key]: this.text().failed });
    });
  }
}
