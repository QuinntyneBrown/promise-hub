import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MENTORING_API, QuizApprovalItem } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhList, PhListItem } from '@promisehub/components';

/**
 * Approves every waiting quiz result at its auto-score (dialog: approve-all-quizzes, L2-081 criterion 4). Closes with how many were
 * approved; stays open with the failure when the call fails.
 */
@Component({
  selector: 'ph-approve-all-quizzes-dialog',
  imports: [PhAlert, PhButton, PhDialog, PhList, PhListItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './approve-all-quizzes-dialog.html',
})
export class ApproveAllQuizzesDialog {
  private readonly api = inject(MENTORING_API);
  protected readonly items = inject<QuizApprovalItem[]>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<number>>(DialogRef);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected approve(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.approveAllQuizzes().subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(outcome.approved);
      else this.failed.set(true);
    });
  }
}
