import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { INCIDENTS_API, ReviewOutcome } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhRadioGroup,
  PhTextarea,
  RadioOption,
} from '@promisehub/components';

/** Mark an incident reviewed (dialog: review-incident): a required note and the outcome; the reporter is told. Closes with true. */
@Component({
  selector: 'ph-review-incident-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-incident-dialog.html',
})
export class ReviewIncidentDialog {
  private readonly api = inject(INCIDENTS_API);
  protected readonly data = inject<{ id: string; reporter: string }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected note = '';
  protected outcome: ReviewOutcome = 'ClosedNoAction';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly outcomes: RadioOption[] = [
    { value: 'ClosedNoAction', label: 'Closed, no further action' },
    {
      value: 'ClosedPolicyChange',
      label: 'Closed, policy change needed',
      hint: 'In the board report',
    },
    { value: 'KeepOpen', label: 'Keep open', hint: 'Follow-up pending' },
  ];

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.review(this.data.id, this.note, this.outcome).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
