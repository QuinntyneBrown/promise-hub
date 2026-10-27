import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CURRICULUM_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';
import { DeleteLessonDialogData } from './delete-lesson-dialog-data';

/** Confirm deleting a lesson (dialog: delete-lesson, L2-067 criterion 6); the row is kept so youth progress stays archived. */
@Component({
  selector: 'ph-delete-lesson-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delete-lesson-dialog.html',
})
export class DeleteLessonDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<DeleteLessonDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected confirm(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.deleteLesson(this.data.id).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.ref.close(true);
      } else {
        this.failed.set(true);
      }
    });
  }
}
