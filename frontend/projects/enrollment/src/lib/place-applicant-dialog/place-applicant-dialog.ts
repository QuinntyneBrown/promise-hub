import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { APPLICATIONS_API, Application, PROGRAMS_API, STAFF_API } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhRadioGroup,
  PhSwitch,
  PhTextField,
  PhTextarea,
  RadioOption,
} from '@promisehub/components';

export interface PlaceApplicantData {
  application: Application;
  /** Admins while Learning is on, for a young person aged 12 to 18 (L2-072 criterion 5). */
  canInvite: boolean;
}

/** How the dialog ended: placed, with what happened to the youth invitation. */
export interface PlaceApplicantResult {
  program: string;
  invited: boolean;
}

/**
 * Place an applicant into a cohort (dialog: place-applicant, L2-072 criteria 4 and 5): the organization's programs that are not
 * archived with their places, a full one disabled; optionally a youth invitation, sent after the placement through the existing
 * youth invitation (ADR 0053). A refused invitation leaves the placement in place and says why.
 */
@Component({
  selector: 'ph-place-applicant-dialog',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhDialog,
    PhRadioGroup,
    PhSwitch,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './place-applicant-dialog.html',
})
export class PlaceApplicantDialog {
  private readonly api = inject(APPLICATIONS_API);
  private readonly staff = inject(STAFF_API);
  protected readonly data = inject<PlaceApplicantData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<PlaceApplicantResult>>(DialogRef);

  protected readonly first = this.data.application.firstName;
  protected readonly guardianFirst =
    this.data.application.guardian?.name.split(' ')[0] ?? 'the family';
  protected readonly cohorts = signal<RadioOption[]>([]);
  protected readonly loadFailed = signal(false);
  protected readonly programId = signal<string>(this.data.application.programId);
  protected readonly invite = signal(this.data.canInvite);
  protected readonly email = signal('');
  protected note = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  /** Set once placed but the invitation was refused: the reason it wasn't sent. */
  protected readonly inviteRefused = signal<string | null>(null);
  protected readonly placedIn = signal<string>('');
  protected readonly primary = computed(() => `Place and text ${this.guardianFirst}`);

  constructor() {
    inject(PROGRAMS_API)
      .list('active')
      .subscribe((r) => {
        if (r.status !== 'loaded') return this.loadFailed.set(true);
        this.cohorts.set(
          r.value.programs.map((p) => {
            const full = p.enrolled >= p.capacity;
            const applied = p.id === this.data.application.programId;
            return {
              value: p.id,
              label: p.name,
              hint: `${p.enrolled} of ${p.capacity} places${applied ? ' · applied for' : ''}${full ? ' · full, waitlist instead' : ''}`,
              disabled: full,
            };
          }),
        );
      });
  }

  protected submit(): void {
    const errors: Record<string, string> = {};
    if (this.invite() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.email().trim()))
      errors['email'] = 'Enter an email like name@example.org.';
    this.errors.set(errors);
    if (Object.keys(errors).length) return;
    this.busy.set(true);
    this.failed.set(false);
    const program = this.cohorts().find((c) => c.value === this.programId())?.label ?? '';
    this.api
      .place(this.data.application.id, this.programId() || null, this.note.trim() || null)
      .subscribe((outcome) => {
        if (outcome.status === 'invalid') {
          this.busy.set(false);
          return this.errors.set(outcome.errors);
        }
        if (outcome.status !== 'saved') {
          this.busy.set(false);
          return this.failed.set(true);
        }
        if (!this.invite()) return this.ref.close({ program, invited: false });
        this.staff
          .inviteYouth(this.data.application.childId, this.email().trim())
          .subscribe((invited) => {
            this.busy.set(false);
            if (invited.status === 'saved') return this.ref.close({ program, invited: true });
            this.placedIn.set(program);
            this.inviteRefused.set(
              invited.status === 'invalid'
                ? (invited.errors['email'] ?? invited.errors['childId'] ?? 'It was refused.')
                : 'Something went wrong. Invite them from their record.',
            );
          });
      });
  }

  protected done(): void {
    this.ref.close({ program: this.placedIn(), invited: false });
  }
}
