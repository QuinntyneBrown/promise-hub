import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CURRICULUM_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';
import { RemoveCompetencyDialogData } from './remove-competency-dialog-data';

/** Confirm removing a competency (dialog: remove-competency, L2-086 criterion 5); its assessments are kept. */
@Component({
  selector: 'ph-remove-competency-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remove-competency-dialog.html',
})
export class RemoveCompetencyDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<RemoveCompetencyDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected confirm(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.removeCompetency(this.data.id).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.ref.close(true);
      } else {
        this.failed.set(true);
      }
    });
  }
}
