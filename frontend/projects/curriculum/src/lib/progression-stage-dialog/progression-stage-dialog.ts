import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextField } from '@promisehub/components';
import { ProgressionStageDialogData } from './progression-stage-dialog-data';

/** Add a stage last, or edit one (dialog: progression-stage, L2-086 criterion 2); closes with the stage's name. */
@Component({
  selector: 'ph-progression-stage-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progression-stage-dialog.html',
})
export class ProgressionStageDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<ProgressionStageDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected name = this.data.stage?.name ?? '';
  protected description = this.data.stage?.description ?? '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    const fields = { name: this.name, description: this.description };
    const stage = this.data.stage;
    (stage ? this.api.updateStage(stage.id, fields) : this.api.addStage(fields)).subscribe(
      (outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.ref.close(this.name.trim());
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      },
    );
  }
}
