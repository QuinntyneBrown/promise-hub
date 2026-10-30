import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { BenefitReview, GuardianPageResult, LEARNING_BOND_API } from '@promisehub/api';
import {
  Fact,
  PhAgentMessage,
  PhAlert,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhGuardianShell,
  PhList,
  PhListItem,
  PhSkeleton,
} from '@promisehub/components';
import { guardianBenefitsText } from './guardian-benefits-text';
import { guardianLearningBondText } from './guardian-learning-bond-text';
import { LearningBondFieldData, LearningBondFieldDialog } from './learning-bond-field-dialog';

/** One row of a benefit application under review. */
interface BenefitRow {
  label: string;
  value: string;
  field: 'address' | 'phone' | 'email' | null;
}

/**
 * One benefit's application (learning-bond-benefit-review, L2-156): the pre-filled fields with Edit and Submit to {program}, only this one;
 * or, for a program the guardian sends themselves, the filled form and Mark as sent.
 */
@Component({
  selector: 'ph-learning-bond-benefit-review-page',
  imports: [
    PhAgentMessage,
    PhAlert,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhGuardianShell,
    PhList,
    PhListItem,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-benefit-review-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondBenefitReviewPage implements OnInit {
  protected readonly api = inject(LEARNING_BOND_API);
  private readonly dialogs = inject(PhDialogs);

  readonly token = input.required<string>();
  readonly key = input.required<string>();

  protected readonly result = signal<GuardianPageResult<BenefitReview> | null>(null);
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
  protected readonly busy = signal(false);
  protected readonly outcome = signal<
    'sent' | 'marked' | 'not-sent' | 'stale' | 'incomplete' | 'error' | null
  >(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.prepareBenefit(this.token(), this.key()).subscribe((r) => {
      this.result.set(r);
      if (r.status === 'loaded' && r.value.status === 'Submitted') this.outcome.set('sent');
      if (r.status === 'loaded' && r.value.status === 'MarkedSent') this.outcome.set('marked');
    });
  }

  protected rows(a: BenefitReview): BenefitRow[] {
    const f = a.fields;
    const l = this.words().fields;
    return [
      { label: l['applicantName']!, value: f.applicantName, field: null },
      {
        label: l['applicantSin']!,
        value: f.applicantSin ? `••• ••• ${f.applicantSin}` : '—',
        field: null,
      },
      {
        label: l['maritalStatus']!,
        value: this.words().marital[f.maritalStatus] ?? f.maritalStatus,
        field: null,
      },
      { label: l['householdSize']!, value: f.householdSize, field: null },
      { label: l['children']!, value: f.children, field: null },
      { label: l['address']!, value: f.address ?? '—', field: 'address' },
      { label: l['phone']!, value: f.phone ?? '—', field: 'phone' },
      { label: l['email']!, value: f.email ?? '—', field: 'email' },
      { label: l['canadaChildBenefit']!, value: f.canadaChildBenefit, field: null },
      { label: l['program']!, value: f.program, field: null },
    ];
  }

  protected facts(a: BenefitReview): Fact[] {
    const w = this.words();
    return [
      { key: 'attach', term: w.attach, value: a.documentFile ?? '—' },
      { key: 'send-to', term: w.sendTo, value: a.sendTo ?? '—' },
    ];
  }

  protected edit(a: BenefitReview, row: BenefitRow): void {
    const data: LearningBondFieldData = {
      token: this.token(),
      applicationId: a.id,
      field: row.field!,
      label: row.label,
      value: row.value === '—' ? '' : row.value,
      text: this.text(),
      benefit: true,
    };
    this.dialogs
      .open<BenefitReview, LearningBondFieldData, LearningBondFieldDialog>(
        LearningBondFieldDialog,
        data,
      )
      .closed.subscribe((changed) => {
        if (!changed) return;
        this.outcome.set(null);
        this.result.set({ status: 'loaded', value: changed as BenefitReview });
      });
  }

  protected submit(a: BenefitReview): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.outcome.set(null);
    this.api.submitBenefit(this.token(), a.id, a.reviewVersion).subscribe((r) => {
      this.busy.set(false);
      this.outcome.set(r.status);
    });
  }

  protected markSent(a: BenefitReview): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.api.markBenefitSent(this.token(), a.id).subscribe((r) => {
      this.busy.set(false);
      this.outcome.set(r.status === 'saved' ? 'marked' : 'error');
    });
  }
}
