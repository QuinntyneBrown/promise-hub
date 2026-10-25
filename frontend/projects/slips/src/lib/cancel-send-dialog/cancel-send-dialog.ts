import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PhButton, PhDialog } from '@promisehub/components';

/** Cancel a scheduled send (dialog: cancel-send). Closes with true to cancel; the slip stays a draft. */
@Component({
  selector: 'ph-cancel-send-dialog',
  imports: [PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cancel-send-dialog.html',
})
export class CancelSendDialog {
  protected readonly data = inject<{ title: string }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}
