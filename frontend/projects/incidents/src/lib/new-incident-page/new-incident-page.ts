import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { INCIDENTS_API, IncidentForm, IncidentReport } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhCard,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhRadioGroup,
  PhSelect,
  PhTextField,
  PhTextarea,
  RadioOption,
  SelectOption,
  ToastService,
} from '@promisehub/components';
import { CATEGORY, GUARDIAN } from '../incident-labels';

const ORDER = [
  'category',
  'childId',
  'occurredAt',
  'whatHappened',
  'actionTaken',
  'guardianContact',
  'severity',
];

/** Report an incident (mock: new-incident): the structured form; every missing fact is named and nothing is saved (L2-023 criterion 1). */
@Component({
  selector: 'ph-new-incident-page',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhRadioGroup,
    PhSelect,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-incident-page.html',
})
export class NewIncidentPage {
  private readonly api = inject(INCIDENTS_API);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly form = signal<IncidentForm | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly report: IncidentReport = {
    category: null,
    childId: null,
    occurredAt: null,
    place: 'Room 2',
    whatHappened: '',
    actionTaken: '',
    guardianContact: null,
    severity: null,
  };

  protected readonly categories: RadioOption[] = Object.entries(CATEGORY).map(([value, label]) => ({
    value,
    label,
  }));
  protected readonly guardianOptions: RadioOption[] = [
    { value: 'CalledAndReached', label: GUARDIAN.CalledAndReached },
    { value: 'LeftMessage', label: GUARDIAN.LeftMessage },
    { value: 'NotYetContacted', label: GUARDIAN.NotYetContacted, hint: 'Say why below' },
  ];
  protected readonly severities: RadioOption[] = [
    { value: 'Minor', label: 'Minor', hint: 'First aid only' },
    { value: 'Moderate', label: 'Moderate', hint: 'Went home or saw a doctor' },
    { value: 'Serious', label: 'Serious', hint: '911 called or hospital' },
  ];
  protected readonly places = ['Room 2', 'Stairwell', 'Gym', 'Outside', 'Bus', 'Other'];
  protected readonly children = computed<SelectOption[]>(() => [
    { value: '', label: 'Choose a child' },
    ...(this.form()?.children ?? []).map((c) => ({ value: c.id, label: c.name })),
  ]);
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    ORDER.filter((field) => this.errors()[field]).map((field) => ({
      field,
      message: this.errors()[field]!,
    })),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loadFailed.set(false);
    this.api
      .form()
      .subscribe((r) =>
        r.status === 'loaded' ? this.form.set(r.value) : this.loadFailed.set(true),
      );
  }

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    const occurredAt = this.report.occurredAt
      ? new Date(this.report.occurredAt).toISOString()
      : null;
    this.api
      .report({ ...this.report, childId: this.report.childId || null, occurredAt })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.toasts.show({
            tone: 'success',
            title: 'Report sent',
            text: `${this.form()?.supervisor ?? 'A supervisor'} reviews it.`,
          });
          void this.router.navigate(['/incidents', outcome.id]);
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
