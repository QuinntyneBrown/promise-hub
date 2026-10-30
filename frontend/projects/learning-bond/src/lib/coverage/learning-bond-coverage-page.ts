import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LEARNING_BOND_API,
  LearningBondCoverageMode,
  LearningBondSettings,
  ROLE_LABELS,
  Role,
} from '@promisehub/api';
import {
  BreadcrumbItem,
  CheckboxOption,
  ErrorSummaryItem,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhCheckboxGroup,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhRadioGroup,
  PhSkeleton,
  RadioOption,
  ToastService,
} from '@promisehub/components';

/** The roles that may see a family's status, in page order; Admin and Program director always do (L2-138 criterion 4). */
const OFFERED: Role[] = ['Admin', 'ProgramDirector', 'SiteLead', 'YouthWorker', 'VolunteerCoordinator'];
const FIXED: Role[] = ['Admin', 'ProgramDirector'];
const FIELDS = ['coverage', 'programIds', 'statusRoles'];

/**
 * Learning Bond coverage (mock: learning-bond-coverage, L2-138): every program or chosen running programs with the households each
 * reaches, and the staff roles that see each family's status. Counts only; no household is named here.
 */
@Component({
  selector: 'ph-learning-bond-coverage-page',
  imports: [
    FormsModule,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhCheckboxGroup,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhRadioGroup,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-coverage-page.html',
  styleUrl: './learning-bond-coverage-page.css',
})
export class LearningBondCoveragePage {
  private readonly api = inject(LEARNING_BOND_API);
  private readonly toasts = inject(ToastService);

  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Settings', link: '/settings/organization' },
    { label: 'Learning Bond', link: '/settings/learning-bond' },
    { label: 'Coverage' },
  ];
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly settings = signal<LearningBondSettings | null>(null);
  protected readonly coverage = signal<LearningBondCoverageMode>('AllPrograms');
  protected readonly programIds = signal<string[]>([]);
  protected readonly roles = signal<string[]>([...FIXED]);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly saving = signal(false);

  protected readonly modes = computed<RadioOption[]>(() => [
    {
      value: 'AllPrograms',
      label: 'Every program',
      hint: `Guardians of every actively enrolled child are invited: ${households(this.settings()?.allHouseholds ?? 0)}.`,
    },
    {
      value: 'ChosenPrograms',
      label: 'Chosen programs',
      hint: 'Only guardians of children enrolled in these.',
    },
  ]);
  protected readonly programs = computed<CheckboxOption[]>(() =>
    (this.settings()?.programs ?? []).map((p) => ({
      value: p.id,
      label: p.name,
      hint: households(p.households),
    })),
  );
  protected readonly roleOptions: CheckboxOption[] = OFFERED.map((r) => ({
    value: r,
    label: ROLE_LABELS[r],
    hint: FIXED.includes(r) ? 'Always' : undefined,
    disabled: FIXED.includes(r),
  }));
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    FIELDS.filter((f) => this.errors()[f]).map((field) => ({
      field,
      message: this.errors()[field]!,
    })),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.settings().subscribe((r) => {
      if (r.status === 'loaded') {
        this.settings.set(r.value);
        this.coverage.set(r.value.coverage);
        this.programIds.set(r.value.programIds);
        this.roles.set(r.value.statusRoles);
        this.state.set('loaded');
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  protected save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    const coverage = this.coverage();
    const programIds = coverage === 'ChosenPrograms' ? this.programIds() : [];
    this.api
      .saveSettings({ coverage, programIds, statusRoles: this.roles() })
      .subscribe((outcome) => {
        this.saving.set(false);
        switch (outcome.status) {
          case 'saved':
            this.errors.set({});
            this.toasts.show({
              tone: 'success',
              title: 'Learning Bond settings saved',
              text: this.reach(coverage, programIds),
            });
            break;
          case 'invalid':
            this.errors.set(outcome.errors);
            break;
          case 'forbidden':
            this.state.set('forbidden');
            break;
          default:
            this.toasts.show({
              tone: 'danger',
              title: 'Learning Bond settings not saved',
              text: 'Something went wrong. Try again.',
            });
        }
      });
  }

  /**
   * "After-School Tutoring and Saturday Sports", or "Every program · 4 households". Chosen programs are named without a total: a household
   * in two of them would be counted twice, and only the server counts households.
   */
  private reach(coverage: LearningBondCoverageMode, programIds: string[]): string {
    if (coverage === 'AllPrograms') {
      return `Every program · ${households(this.settings()?.allHouseholds ?? 0)}`;
    }
    const names = (this.settings()?.programs ?? [])
      .filter((p) => programIds.includes(p.id))
      .map((p) => p.name);
    return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]!;
  }
}

function households(n: number): string {
  return `${n} household${n === 1 ? '' : 's'}`;
}
