import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LearningBondSignerRequest } from '@promisehub/api';
import { PhButton, PhDialog, PhEmailPreview } from '@promisehub/components';

/**
 * The email the named signer received (mock: learning-bond-email/info, L2-137 criterion 11), opened from the Named signer card. The
 * words are the server's; "Read and accept" stands in for the link, which only the signer has.
 */
@Component({
  selector: 'ph-learning-bond-signer-email-dialog',
  imports: [PhButton, PhDialog, PhEmailPreview],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-signer-email-dialog.html',
})
export class LearningBondSignerEmailDialog {
  protected readonly signer = inject<LearningBondSignerRequest>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<void>>(DialogRef);
}
