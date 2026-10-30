import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LEARNING_BOND_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextarea } from '@promisehub/components';
import { GuardianLearningBondText } from './guardian-learning-bond-text';

/** The data the Fix this dialog needs: the link, the child, the organization and the page's words. */
export interface LearningBondRecordFixData {
  token: string;
  childId: string;
  firstName: string;
  organization: string;
  text: GuardianLearningBondText;
}

/** Fix this (L2-146 criterion 1): what is wrong with the child's record, sent to staff; the claim waits until it's fixed. Closes with true. */
@Component({
  selector: 'ph-learning-bond-record-fix-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-record-fix-dialog.html',
})
export class LearningBondRecordFixDialog {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly data = inject<LearningBondRecordFixData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected note = '';
  protected readonly error = signal<string | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected send(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api.requestRecordFix(this.data.token, this.data.childId, this.note).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'saved') this.ref.close(true);
      else if (r.status === 'invalid') this.error.set(r.errors['note'] ?? null);
      else this.failed.set(true);
    });
  }
}
