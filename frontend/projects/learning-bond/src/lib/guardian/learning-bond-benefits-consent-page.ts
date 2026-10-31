import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { GuardianPageResult, LEARNING_BOND_API, BenefitsConsent } from '@promisehub/api';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PhAlert,
  PhButton,
  PhCard,
  PhCheckbox,
  PhEmptyState,
  PhGuardianShell,
  PhSkeleton,
  PhTextField,
} from '@promisehub/components';
import { guardianBenefitsText } from './guardian-benefits-text';
import { guardianLearningBondText } from './guardian-learning-bond-text';

/** The Benefits consent (L2-153 criterion 2): its own wording, a typed name and Agree; then the three questions. */
@Component({
  selector: 'ph-learning-bond-benefits-consent-page',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCard,
    PhCheckbox,
    PhEmptyState,
    PhGuardianShell,
    PhSkeleton,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-benefits-consent-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondBenefitsConsentPage implements OnInit {
  protected readonly api = inject(LEARNING_BOND_API);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<BenefitsConsent> | null>(null);
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
    this.api.benefitsConsent(this.token()).subscribe((r) => this.result.set(r));
  }

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected agreed = false;
  protected typedName = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected agree(): void {
    if (this.busy()) return;
    if (!this.agreed) {
      this.errors.set({ agreed: this.words().tickToAgree });
      return;
    }
    this.busy.set(true);
    this.failed.set(false);
    this.api.giveBenefitsConsent(this.token(), this.typedName).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'saved')
        void this.router.navigate(['../intake'], { relativeTo: this.route });
      else if (r.status === 'invalid') this.errors.set(r.errors);
      else this.failed.set(true);
    });
  }
}
