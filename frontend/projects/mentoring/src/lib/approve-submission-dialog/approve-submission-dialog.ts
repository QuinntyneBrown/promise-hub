import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GradeOutcome, MENTORING_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';
import { GradeDialogData } from '../grade-dialog-data';

/**
 * Confirms approving a submission (dialog: approve-submission, L2-080 criterion 4): names the points, then approves; closes with the
 * outcome, and stays open with the failure when the call fails.
 */
@Component({
  selector: 'ph-approve-submission-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './approve-submission-dialog.html',
})
export class ApproveSubmissionDialog {
  private readonly api = inject(MENTORING_API);
  protected readonly data = inject<GradeDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<GradeOutcome>>(DialogRef);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected approve(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .grade(this.data.submissionId, { ...this.data.request, decision: 'approve' })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'error') this.failed.set(true);
        else this.ref.close(outcome);
      });
  }
}
