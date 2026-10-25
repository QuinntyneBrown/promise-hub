import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Guardian, GuardianChanges, HOUSEHOLDS_API } from '@promisehub/api';
import {
  PhButton,
  PhDialog,
  PhSelect,
  PhSwitch,
  PhTextField,
  ToastService,
} from '@promisehub/components';
import { RELATIONSHIPS } from '../relationships';

/** Edit a guardian (dialog: edit-guardian). Closes with true once saved. */
@Component({
  selector: 'ph-edit-guardian-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhSelect, PhSwitch, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-guardian-dialog.html',
})
export class EditGuardianDialog {
  private readonly api = inject(HOUSEHOLDS_API);
  private readonly toasts = inject(ToastService);
  protected readonly guardian = inject<Guardian>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly relationships = RELATIONSHIPS;
  protected changes: GuardianChanges = {
    name: this.guardian.name,
    relationship: this.guardian.relationship,
    mobile: this.guardian.mobile ?? '',
    canPickUp: this.guardian.canPickUp,
    canSign: this.guardian.canSign,
  };
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.api.updateGuardian(this.guardian.id, this.changes).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({ tone: 'success', title: 'Guardian saved', text: this.changes.name });
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.errors.set({ name: 'We couldn’t save. Try again.' });
      }
    });
  }
}
