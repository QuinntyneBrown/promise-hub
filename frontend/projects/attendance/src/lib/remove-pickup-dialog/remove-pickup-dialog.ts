import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PICKUP_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';

export interface RemovePickupData {
  childId: string;
  pickupId: string;
  name: string;
  firstName: string;
  primary: string | null;
}

/** Remove an approved adult (dialog: remove-pickup); the primary guardian is texted and the removal audited. Closes with true. */
@Component({
  selector: 'ph-remove-pickup-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remove-pickup-dialog.html',
})
export class RemovePickupDialog {
  private readonly api = inject(PICKUP_API);
  protected readonly data = inject<RemovePickupData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected remove(): void {
    this.busy.set(true);
    this.api.remove(this.data.childId, this.data.pickupId).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
