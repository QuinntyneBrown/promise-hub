import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PhButton, PhDialog, PhTextarea } from '@promisehub/components';
import { GuardianText } from '../guardian-text';

/** Decline a slip (dialog: decline-slip). Closes with the reason, or undefined when cancelled. */
@Component({
  selector: 'ph-decline-slip-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './decline-slip-dialog.html',
})
export class DeclineSlipDialog {
  protected readonly data = inject<{ child: string; text: GuardianText }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  protected reason = '';
}
