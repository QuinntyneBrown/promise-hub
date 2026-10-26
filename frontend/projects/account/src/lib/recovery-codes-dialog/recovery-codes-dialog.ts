import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ACCOUNT_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';

/** Recovery codes (dialog: recovery-codes): makes ten new codes and shows them once. */
@Component({
  selector: 'ph-recovery-codes-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recovery-codes-dialog.html',
  styleUrl: './recovery-codes-dialog.css',
})
export class RecoveryCodesDialog {
  private readonly api = inject(ACCOUNT_API);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly codes = signal<string[] | null>(null);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected make(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.newRecoveryCodes().subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'loaded') this.codes.set(r.value.codes);
      else this.failed.set(true);
    });
  }
}
