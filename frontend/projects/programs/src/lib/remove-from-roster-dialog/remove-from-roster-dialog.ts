import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PROGRAMS_API, Program, RosterChild } from '@promisehub/api';
import {
  PhButton,
  PhDialog,
  PhRadioGroup,
  RadioOption,
  ToastService,
} from '@promisehub/components';

/** Remove a child from a program's roster (dialog: remove-from-roster). Attendance stays in reports. */
@Component({
  selector: 'ph-remove-from-roster-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhRadioGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './remove-from-roster-dialog.html',
})
export class RemoveFromRosterDialog {
  private readonly api = inject(PROGRAMS_API);
  private readonly toasts = inject(ToastService);
  protected readonly data = inject<{ program: Program; child: RosterChild }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly reasons: RadioOption[] = [
    { value: 'Family withdrew', label: 'Family withdrew' },
    { value: 'Moved to another program', label: 'Moved to another program' },
    { value: 'Added by mistake', label: 'Added by mistake' },
  ];
  protected reason = 'Family withdrew';
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.api
      .removeFromRoster(this.data.program.id, this.data.child.id, this.reason)
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.toasts.show({
            tone: 'success',
            title: `${this.data.child.name} removed`,
            text: this.data.program.name,
          });
        }
        this.ref.close(outcome.status === 'saved');
      });
  }
}
