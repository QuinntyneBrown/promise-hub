import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LEARNING_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextarea } from '@promisehub/components';
import { SubmitProjectDialogData } from './submit-project-dialog-data';

/** Submit a coding project for review with an optional note to the mentor (dialog: submit-project, L2-070 criterion 4); closes with true once sent. */
@Component({
  selector: 'ph-submit-project-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './submit-project-dialog.html',
})
export class SubmitProjectDialog {
  private readonly api = inject(LEARNING_API);
  protected readonly data = inject<SubmitProjectDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected note = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .submitProject(this.data.lessonId, { code: this.data.code, note: this.note || null })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.ref.close(true);
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
