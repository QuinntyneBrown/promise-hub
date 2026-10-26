import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ACCOUNT_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';

/** Sign out everywhere? (dialog: sign-out-all): every other device is signed out; this one stays. Closes with true. */
@Component({
  selector: 'ph-sign-out-all-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sign-out-all-dialog.html',
})
export class SignOutAllDialog {
  private readonly api = inject(ACCOUNT_API);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected confirm(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.signOutOthers().subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
