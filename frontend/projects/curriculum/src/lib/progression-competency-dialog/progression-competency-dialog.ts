import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextField, PhTextarea } from '@promisehub/components';
import { ProgressionCompetencyDialogData } from './progression-competency-dialog-data';

/** Add a competency to a stage (dialog: progression-competency, L2-086 criterion 4); closes with its name. */
@Component({
  selector: 'ph-progression-competency-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextField, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progression-competency-dialog.html',
})
export class ProgressionCompetencyDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<ProgressionCompetencyDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected name = '';
  protected description = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .addCompetency(this.data.stageId, { name: this.name, description: this.description })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.ref.close(this.name.trim());
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
