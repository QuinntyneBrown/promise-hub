import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PhButton, PhDialog } from '@promisehub/components';

/** Send a scheduled slip now (dialog: send-now). Closes with true to send. */
@Component({
  selector: 'ph-send-now-dialog',
  imports: [PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './send-now-dialog.html',
})
export class SendNowDialog {
  protected readonly data = inject<{ title: string; when: string; households: number }>(
    DIALOG_DATA,
  );
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}
