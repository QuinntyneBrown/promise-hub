import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ACCOUNT_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextField } from '@promisehub/components';

/**
 * Change your password (dialog: change-password, L2-118): the current password, then the new one twice. Closes with true once changed;
 * Your account then says the other devices were signed out.
 */
@Component({
  selector: 'ph-change-password-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-password-dialog.html',
})
export class ChangePasswordDialog {
  private readonly api = inject(ACCOUNT_API);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected current = '';
  protected password = '';
  protected repeat = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.changePassword(this.current, this.password, this.repeat).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }
}
