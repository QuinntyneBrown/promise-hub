import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GUARDIAN_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';
import { ConsentText } from '../consent-text';

/** Withdraw consent (dialog: withdraw-consent, L2-058 criterion 2). Closes with true once withdrawn. */
@Component({
  selector: 'ph-withdraw-consent-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './withdraw-consent-dialog.html',
})
export class WithdrawConsentDialog {
  private readonly api = inject(GUARDIAN_API);
  protected readonly data = inject<{ token: string; child: string; text: ConsentText }>(
    DIALOG_DATA,
  );
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected withdraw(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.withdrawConsent(this.data.token).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved' || outcome.status === 'not-found') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
