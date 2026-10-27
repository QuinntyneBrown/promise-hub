import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextField } from '@promisehub/components';
import { NewLessonDialogData } from './new-lesson-dialog-data';

/** Add a lesson at the end of a module (dialog: new-lesson, L2-067 criterion 1); closes with the new lesson's id. */
@Component({
  selector: 'ph-new-lesson-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-lesson-dialog.html',
})
export class NewLessonDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<NewLessonDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected title = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.createLesson(this.data.moduleId, this.title).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.ref.close(outcome.id);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }
}
