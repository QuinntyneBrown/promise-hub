import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { STAFF_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';

/** Remove a staff member's access (dialog: remove-staff); their next action signs them out and their records keep their name. Closes with true. */
@Component({
  selector: 'ph-remove-staff-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remove-staff-dialog.html',
})
export class RemoveStaffDialog {
  private readonly api = inject(STAFF_API);
  protected readonly data = inject<{ id: string; name: string }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected remove(): void {
    this.busy.set(true);
    this.api.remove(this.data.id).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
