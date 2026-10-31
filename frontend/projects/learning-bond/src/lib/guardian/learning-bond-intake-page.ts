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
import { ActivatedRoute, Router } from '@angular/router';
import { GuardianPageResult, LEARNING_BOND_API, LearningBondIntake } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAgentMessage,
  PhAlert,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhErrorSummary,
  PhGuardianShell,
  PhRadioGroup,
  PhSkeleton,
  PhStepper,
  PhTextField,
  RadioOption,
  formatDate,
} from '@promisehub/components';
import { LearningBondAgentBubble } from './learning-bond-agent-bubble';
import { guardianLearningBondText } from './guardian-learning-bond-text';
import {
  LearningBondRecordFixData,
  LearningBondRecordFixDialog,
} from './learning-bond-record-fix-dialog';

/**
 * The Learning Bond intake (mock: learning-bond-intake, L2-146): the child's record to confirm, then only the guardian's SIN, the child's
 * SIN and last year's tax return. SINs go in form fields, are checked on the server and come back only as their last three digits; what
 * the household already gave is shown masked with Change.
 */
@Component({
  selector: 'ph-learning-bond-intake-page',
  imports: [
    FormsModule,
    PhAgentMessage,
    PhAlert,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorSummary,
    PhGuardianShell,
    PhRadioGroup,
    PhSkeleton,
    PhStepper,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-intake-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondIntakePage implements OnInit {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly agent = new LearningBondAgentBubble(this.api, inject(PhDialogs), 'Intake');
  private readonly dialogs = inject(PhDialogs);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly token = input.required<string>();
  readonly childId = input.required<string>();

  protected readonly result = signal<GuardianPageResult<LearningBondIntake> | null>(null);
  protected readonly confirmed = signal(false);
  protected readonly changing = signal<{ guardian: boolean; child: boolean }>({
    guardian: false,
    child: false,
  });
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly saved = signal(false);
  protected guardianSin = '';
  protected childSin = '';
  protected taxFiled = '';

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
  protected readonly taxOptions = computed<RadioOption[]>(() => [
    { value: 'Yes', label: this.text().yes },
    { value: 'No', label: this.text().no },
    { value: 'NotSure', label: this.text().notSure },
  ]);
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    (
      [
        ['guardianSin', 'intake-guardian-sin'],
        ['childSin', 'intake-child-sin'],
        ['taxFiled', 'intake-tax'],
      ] as const
    )
      .filter(([f]) => this.errors()[f])
      .map(([f, field]) => ({ field, message: this.errors()[f]! })),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.api.intake(this.token(), this.childId()).subscribe((r) => {
      this.result.set(r);
      if (r.status === 'loaded') this.agent.load(this.token());
      if (r.status === 'loaded') this.taxFiled = r.value.taxFiled ?? '';
    });
  }

  protected born(i: LearningBondIntake): string {
    return i.dateOfBirth ? formatDate(i.dateOfBirth) : '';
  }

  protected asksGuardian(i: LearningBondIntake): boolean {
    return !i.guardianSin || this.changing().guardian;
  }

  protected asksChild(i: LearningBondIntake): boolean {
    return !i.childSin || this.changing().child;
  }

  protected change(which: 'guardian' | 'child'): void {
    this.changing.update((c) => ({ ...c, [which]: true }));
  }

  /** No SIN for the child yet: the claim pauses with how to get one (L2-151 criterion 1). */
  protected noSinYet(): void {
    this.api.pauseClaim(this.token(), this.childId()).subscribe((r) => {
      if (r.status === 'saved')
        void this.router.navigate(['../paused'], { relativeTo: this.route });
      else this.failed.set(true);
    });
  }

  protected fix(i: LearningBondIntake): void {
    const data: LearningBondRecordFixData = {
      token: this.token(),
      childId: i.childId,
      firstName: i.firstName,
      organization: i.organization,
      text: this.text(),
    };
    this.dialogs
      .open<boolean, LearningBondRecordFixData, LearningBondRecordFixDialog>(
        LearningBondRecordFixDialog,
        data,
      )
      .closed.subscribe((sent) => {
        if (sent) this.load();
      });
  }

  protected save(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .saveIntake(this.token(), this.childId(), {
        guardianSin: this.guardianSin || null,
        childSin: this.childSin || null,
        taxFiled: this.taxFiled || null,
      })
      .subscribe((r) => {
        this.busy.set(false);
        if (r.status === 'saved') {
          this.errors.set({});
          this.guardianSin = '';
          this.childSin = '';
          this.changing.set({ guardian: false, child: false });
          this.saved.set(true);
          this.load();
        } else if (r.status === 'invalid') {
          this.errors.set(r.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
