import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PhButton, PhDialog } from '@promisehub/components';
import { LeaveChoice } from './leave-choice';

/**
 * Asks before unsent work is left behind (dialog: unsaved-changes, L2-079 criteria 1 and 4): Keep editing is the default, Save draft and
 * leave keeps a draft on this device, Leave without saving is the quiet third choice. Escape keeps editing.
 */
@Component({
  selector: 'ph-unsaved-changes-dialog',
  imports: [PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unsaved-changes-dialog.html',
})
export class UnsavedChangesDialog {
  protected readonly ref = inject<DialogRef<LeaveChoice>>(DialogRef);
}
