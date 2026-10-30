import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LEARNING_BOND_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';

/**
 * Cancel the launch? (dialog: learning-bond-cancel-launch, L2-140 criterion 6): nothing has been sent and nothing will be. The data is the
 * scheduled day as the page shows it. Closes with true once cancelled.
 */
@Component({
  selector: 'ph-learning-bond-cancel-launch-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-cancel-launch-dialog.html',
})
export class LearningBondCancelLaunchDialog {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly when = inject<string>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected confirm(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.cancelLaunch().subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
