import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOUSEHOLDS_API, Household, NewChild } from '@promisehub/api';
import { PhButton, PhDialog, PhTextField, PhTextarea, ToastService } from '@promisehub/components';

/** Add a child to a household (dialog: add-child). Closes with true once added. */
@Component({
  selector: 'ph-add-child-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhTextField, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-child-dialog.html',
})
export class AddChildDialog {
  private readonly api = inject(HOUSEHOLDS_API);
  private readonly toasts = inject(ToastService);
  protected readonly household = inject<Household>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected child: NewChild = { name: '', dateOfBirth: null, school: '', allergies: '' };
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.api
      .addChild(this.household.id, { ...this.child, dateOfBirth: this.child.dateOfBirth || null })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.toasts.show({ tone: 'success', title: 'Child added', text: this.child.name });
          this.ref.close(true);
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.errors.set({ name: 'We couldn’t add the child. Try again.' });
        }
      });
  }
}
