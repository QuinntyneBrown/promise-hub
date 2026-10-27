import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CURRICULUM_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';
import { DeleteQuestionDialogData } from './delete-question-dialog-data';

/** Confirm deleting a quiz question (dialog: delete-question, L2-073 criterion 3). */
@Component({
  selector: 'ph-delete-question-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delete-question-dialog.html',
})
export class DeleteQuestionDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<DeleteQuestionDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected confirm(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.deleteQuestion(this.data.id).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.ref.close(true);
      } else {
        this.failed.set(true);
      }
    });
  }
}
