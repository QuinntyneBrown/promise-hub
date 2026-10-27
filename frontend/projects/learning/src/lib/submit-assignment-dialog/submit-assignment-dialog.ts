import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LEARNING_API, SubmitOutcome } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';
import { SubmitAssignmentDialogData } from './submit-assignment-dialog-data';

/**
 * Confirms sending an assignment's work (dialog: submit-assignment, L2-077 criterion 5, L2-078 criterion 3): says it is read only while the
 * mentor reviews it, then submits or resubmits; closes with the outcome, and stays open with the failure when the call fails.
 */
@Component({
  selector: 'ph-submit-assignment-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './submit-assignment-dialog.html',
})
export class SubmitAssignmentDialog {
  private readonly api = inject(LEARNING_API);
  protected readonly data = inject<SubmitAssignmentDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<SubmitOutcome>>(DialogRef);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected mentor(): string {
    return this.data.mentorName ?? 'Your mentor';
  }

  protected heading(): string {
    const who = this.data.mentorName?.split(' ')[0] ?? 'your mentor';
    return this.data.submissionId ? `Send it to ${who} again?` : `Send it to ${who}?`;
  }

  protected send(): void {
    this.busy.set(true);
    this.failed.set(false);
    const call = this.data.submissionId
      ? this.api.resubmit(this.data.submissionId, this.data.work)
      : this.api.submitAssignment(this.data.assignmentId, this.data.work);
    call.subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'error') this.failed.set(true);
      else this.ref.close(outcome);
    });
  }
}
