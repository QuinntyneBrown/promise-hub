import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CURRICULUM_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';
import { DeleteBadgeDialogData } from './delete-badge-dialog-data';

/** Confirm deleting a badge (dialog: delete-badge, L2-084 criterion 5); youth who earned it keep it. */
@Component({
  selector: 'ph-delete-badge-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delete-badge-dialog.html',
})
export class DeleteBadgeDialog {
  private readonly api = inject(CURRICULUM_API);
  protected readonly data = inject<DeleteBadgeDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected confirm(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.deleteBadge(this.data.id).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.ref.close(true);
      } else {
        this.failed.set(true);
      }
    });
  }
}
