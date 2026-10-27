import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API, WriteOutcome } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhSelect,
  PhTextField,
  SelectOption,
} from '@promisehub/components';
import { Observable } from 'rxjs';
import { attachOptions } from '../attach-options';
import { NewAssessmentDialogData } from './new-assessment-dialog-data';

/** Add a quiz or an assignment to a module (dialog: new-assessment, L2-073 and L2-074 criterion 1); closes with its id. */
@Component({
  selector: 'ph-new-assessment-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhSelect, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-assessment-dialog.html',
})
export class NewAssessmentDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<NewAssessmentDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected title = '';
  protected lessonId = '';
  protected readonly attachOptions: SelectOption[] = attachOptions(this.data.lessons);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.call().subscribe((outcome) => {
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

  private call(): Observable<WriteOutcome> {
    const lessonId = this.lessonId || null;
    return this.data.kind === 'quiz'
      ? this.api.createQuiz(this.data.moduleId, lessonId, this.title)
      : this.api.createAssignment(this.data.moduleId, lessonId, this.title);
  }
}
