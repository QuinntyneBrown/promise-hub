import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role, STAFF_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhRadioGroup } from '@promisehub/components';
import { ROLE_OPTIONS } from '../role-labels';

/** Change a staff member's role (dialog: change-role); it applies on their next action. Closes with true. */
@Component({
  selector: 'ph-change-role-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-role-dialog.html',
})
export class ChangeRoleDialog {
  private readonly api = inject(STAFF_API);
  protected readonly data = inject<{ id: string; name: string; role: Role }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected role: Role = this.data.role;
  protected readonly roles = ROLE_OPTIONS;
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.changeRole(this.data.id, this.role).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
