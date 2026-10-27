import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PhButton, PhDialog } from '@promisehub/components';
import { LeaveChoice } from '../unsaved-changes-dialog/leave-choice';

/**
 * Asks before an unsaved reflection is left behind (dialog: leave-reflection, L2-079 criterion 5): Keep editing, Save draft and leave
 * keeps a draft on this device, Leave without saving is the quiet third choice. Escape keeps editing.
 */
@Component({
  selector: 'ph-leave-reflection-dialog',
  imports: [PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './leave-reflection-dialog.html',
})
export class LeaveReflectionDialog {
  protected readonly ref = inject<DialogRef<LeaveChoice>>(DialogRef);
}
