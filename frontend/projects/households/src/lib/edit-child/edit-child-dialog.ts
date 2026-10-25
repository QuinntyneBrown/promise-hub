import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Child, ChildChanges, HOUSEHOLDS_API } from '@promisehub/api';
import { PhButton, PhDialog, PhTextField } from '@promisehub/components';

/** Edit a child's details (dialog: edit-child). Closes with true once saved. */
@Component({
  selector: 'ph-edit-child-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-child-dialog.html',
})
export class EditChildDialog {
  private readonly api = inject(HOUSEHOLDS_API);
  protected readonly child = inject<Child>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected changes: ChildChanges = {
    name: this.child.name,
    dateOfBirth: this.child.dateOfBirth,
    school: this.child.school ?? '',
  };
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.api
      .updateChild(this.child.id, {
        ...this.changes,
        dateOfBirth: this.changes.dateOfBirth || null,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.ref.close(true);
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.errors.set({ name: 'We couldn’t save. Try again.' });
        }
      });
  }
}
