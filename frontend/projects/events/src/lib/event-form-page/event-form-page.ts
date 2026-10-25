import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EVENTS_API, EventFields, PROGRAMS_API } from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhPageHeader,
  PhRadioGroup,
  PhSelect,
  PhSwitch,
  PhTextField,
  PhTextarea,
  RadioOption,
  SelectOption,
  ToastService,
  fromLocalInput,
  toLocalInput,
} from '@promisehub/components';
import { map } from 'rxjs';

/** New or edit event (mock: event-form). Saves and opens the event. */
@Component({
  selector: 'ph-event-form-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhPageHeader,
    PhRadioGroup,
    PhSelect,
    PhSwitch,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-form-page.html',
})
export class EventFormPage {
  private readonly api = inject(EVENTS_API);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  /** Route parameter; absent for a new event. */
  readonly eventId = input<string | undefined>(undefined);

  protected readonly programs = toSignal(
    inject(PROGRAMS_API)
      .list('active')
      .pipe(
        map((r): SelectOption[] =>
          r.status === 'loaded'
            ? r.value.programs.map((p) => ({ value: p.id, label: p.name }))
            : [],
        ),
      ),
    { initialValue: [] as SelectOption[] },
  );
  protected fields: EventFields = {
    name: '',
    programId: '',
    startsAt: null,
    endsAt: null,
    place: '',
    requiresSlip: false,
    noShowAlert: true,
    staffNotes: '',
  };
  protected startsAt = '';
  protected endsAt = '';
  protected slip = 'no';
  protected readonly slipOptions: RadioOption[] = [
    { value: 'no', label: 'Not needed', hint: 'Season consent covers it' },
    { value: 'yes', label: 'Required', hint: 'Write it next' },
  ];
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly loaded = signal(false);

  constructor() {
    effect(() => {
      const programs = this.programs();
      if (!this.fields.programId && programs.length) {
        this.fields.programId = programs[0]!.value;
      }
    });
    effect(() => {
      const id = this.eventId();
      if (!id) {
        this.loaded.set(true);
        return;
      }
      this.api.get(id).subscribe((r) => {
        if (r.status === 'loaded') {
          const e = r.value;
          this.fields = {
            name: e.name,
            programId: e.programId,
            startsAt: e.startsAt,
            endsAt: e.endsAt,
            place: e.place ?? '',
            requiresSlip: e.requiresSlip,
            noShowAlert: e.noShowAlert,
            staffNotes: e.staffNotes ?? '',
          };
          this.startsAt = toLocalInput(e.startsAt);
          this.endsAt = toLocalInput(e.endsAt);
          this.slip = e.requiresSlip ? 'yes' : 'no';
        }
        this.loaded.set(true);
      });
    });
  }

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    const fields: EventFields = {
      ...this.fields,
      startsAt: fromLocalInput(this.startsAt),
      endsAt: fromLocalInput(this.endsAt),
      requiresSlip: this.slip === 'yes',
    };
    const id = this.eventId();
    (id ? this.api.update(id, fields) : this.api.create(fields)).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: id ? 'Event saved' : 'Event created',
          text: fields.name,
        });
        void this.router.navigate(['/events', id ?? outcome.id]);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }
}
