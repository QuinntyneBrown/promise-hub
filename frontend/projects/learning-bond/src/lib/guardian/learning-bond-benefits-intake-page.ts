import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { GuardianPageResult, LEARNING_BOND_API, BenefitsIntake } from '@promisehub/api';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PhAgentMessage,
  PhAlert,
  PhButton,
  PhCard,
  PhEmptyState,
  PhGuardianShell,
  PhRadioGroup,
  PhSelect,
  PhSkeleton,
  PhTextField,
  RadioOption,
  SelectOption,
} from '@promisehub/components';
import { guardianBenefitsText } from './guardian-benefits-text';
import { guardianLearningBondText } from './guardian-learning-bond-text';

/** The benefits intake (L2-154): household size, marital status, the Canada Child Benefit now, income changed, and who claims each child when separated or divorced; nothing already given is asked. */
@Component({
  selector: 'ph-learning-bond-benefits-intake-page',
  imports: [
    FormsModule,
    PhAgentMessage,
    PhAlert,
    PhButton,
    PhCard,
    PhEmptyState,
    PhGuardianShell,
    PhRadioGroup,
    PhSelect,
    PhSkeleton,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-benefits-intake-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondBenefitsIntakePage implements OnInit {
  protected readonly api = inject(LEARNING_BOND_API);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<BenefitsIntake> | null>(null);
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
    this.api.benefitsIntake(this.token()).subscribe((r) => this.result.set(r));
  }

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected size = '';
  protected marital = '';
  protected ccb = '';
  protected income = '';
  protected custody: Record<string, string> = {};
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly maritalOptions = computed<SelectOption[]>(() =>
    Object.entries(this.words().marital).map(([value, label]) => ({ value, label })),
  );
  protected readonly ccbOptions = computed<RadioOption[]>(() => {
    const b = this.words();
    return [
      { value: 'Yes', label: b.yes },
      { value: 'No', label: b.no },
      { value: 'NotSure', label: b.notSure },
    ];
  });
  protected readonly incomeOptions = computed<RadioOption[]>(() => {
    const b = this.words();
    return [
      { value: 'Yes', label: b.yes },
      { value: 'No', label: b.no },
    ];
  });
  protected readonly claimsOptions = computed<RadioOption[]>(() =>
    Object.entries(this.words().claims).map(([value, label]) => ({ value, label })),
  );

  protected separated(): boolean {
    return this.marital === 'Separated' || this.marital === 'Divorced';
  }

  protected save(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .saveBenefitsIntake(this.token(), {
        householdSize: this.size === '' ? null : Number(this.size),
        maritalStatus: this.marital || null,
        ccbNow: this.ccb || null,
        incomeChanged: this.income || null,
        custody: this.separated() ? this.custody : {},
      })
      .subscribe((r) => {
        this.busy.set(false);
        if (r.status === 'saved') void this.router.navigate(['..'], { relativeTo: this.route });
        else if (r.status === 'invalid') this.errors.set(r.errors);
        else this.failed.set(true);
      });
  }
}
