import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MENTORING_API } from '@promisehub/api';
import {
  CheckboxOption,
  PhAlert,
  PhButton,
  PhCheckboxGroup,
  PhDialog,
  PhSelect,
  SelectOption,
  ToastService,
} from '@promisehub/components';
import { CohortMentorsDialogData } from './cohort-mentors-dialog-data';

/** Set a cohort's lead and supporting mentors (dialog: cohort-mentors); saving replaces the whole team (L2-062 criterion 4). */
@Component({
  selector: 'ph-cohort-mentors-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhCheckboxGroup, PhDialog, PhSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cohort-mentors-dialog.html',
})
export class CohortMentorsDialog {
  private readonly api = inject(MENTORING_API);
  private readonly toasts = inject(ToastService);
  protected readonly data = inject<CohortMentorsDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly leadOptions: SelectOption[] = [
    { value: '', label: 'Choose a mentor' },
    ...this.data.mentoring.mentors.map((m) => ({ value: m.id, label: m.name })),
  ];
  protected readonly supportingOptions: CheckboxOption[] = this.data.mentoring.mentors.map((m) => ({
    value: m.id,
    label: m.name,
  }));
  protected leadMentorId = this.data.mentoring.lead?.id ?? '';
  protected supportingMentorIds = this.data.mentoring.supporting.map((m) => m.id);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .setCohortMentors(this.data.program.id, this.leadMentorId || null, this.supportingMentorIds)
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.toasts.show({
            tone: 'success',
            title: 'Mentors saved',
            text: this.data.program.name,
          });
          this.ref.close(true);
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
