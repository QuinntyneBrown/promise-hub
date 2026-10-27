import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PROGRAMS_API, ProgramFields } from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhPageHeader,
  PhRadioGroup,
  PhSwitch,
  PhTextField,
  RadioOption,
  ToastService,
} from '@promisehub/components';

/** New or edit program (mock: program-form). Saves and opens the program. */
@Component({
  selector: 'ph-program-form-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhPageHeader,
    PhRadioGroup,
    PhSwitch,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './program-form-page.html',
})
export class ProgramFormPage {
  private readonly api = inject(PROGRAMS_API);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  /** Route parameter; absent for a new program. */
  readonly programId = input<string | undefined>(undefined);

  protected fields: ProgramFields = {
    name: '',
    startsOn: null,
    endsOn: null,
    schedule: '',
    capacity: null,
    ages: '',
    enrollmentOpen: false,
    seasonConsent: true,
    term: '',
  };
  protected enrollment = 'closed';
  protected readonly enrollmentOptions: RadioOption[] = [
    { value: 'open', label: 'Open now', hint: 'Guardians can enroll on save' },
    { value: 'closed', label: 'Closed', hint: 'Open later' },
  ];
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly loaded = signal(false);

  constructor() {
    effect(() => {
      const id = this.programId();
      if (!id) {
        this.loaded.set(true);
        return;
      }
      this.api.get(id).subscribe((r) => {
        if (r.status === 'loaded') {
          const p = r.value;
          this.fields = {
            name: p.name,
            startsOn: p.startsOn,
            endsOn: p.endsOn,
            schedule: p.schedule ?? '',
            capacity: p.capacity,
            ages: p.ages ?? '',
            enrollmentOpen: p.enrollmentOpen,
            seasonConsent: p.seasonConsent,
            term: p.term ?? '',
          };
          this.enrollment = p.enrollmentOpen ? 'open' : 'closed';
        }
        this.loaded.set(true);
      });
    });
  }

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    const fields = {
      ...this.fields,
      capacity: this.fields.capacity === null ? null : Number(this.fields.capacity),
      enrollmentOpen: this.enrollment === 'open',
    };
    const id = this.programId();
    (id ? this.api.update(id, fields) : this.api.create(fields)).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: id ? 'Program saved' : 'Program created',
          text: fields.name,
        });
        void this.router.navigate(['/programs', id ?? outcome.id]);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }
}
