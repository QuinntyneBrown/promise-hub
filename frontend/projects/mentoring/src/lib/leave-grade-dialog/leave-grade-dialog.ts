import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PhButton, PhDialog } from '@promisehub/components';
import { LeaveChoice } from '../leave-choice';

/**
 * Asks before an unsaved grade is left behind (dialog: leave-grade, L2-080 criterion 8): Keep editing is the default, Save draft and leave
 * saves the scores and comment as a draft grade, Leave without saving is the quiet third choice. Escape keeps editing.
 */
@Component({
  selector: 'ph-leave-grade-dialog',
  imports: [PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './leave-grade-dialog.html',
})
export class LeaveGradeDialog {
  protected readonly ref = inject<DialogRef<LeaveChoice>>(DialogRef);
}
