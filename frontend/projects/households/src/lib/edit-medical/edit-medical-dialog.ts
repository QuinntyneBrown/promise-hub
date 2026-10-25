import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Child, HOUSEHOLDS_API, MedicalChanges } from '@promisehub/api';
import {
  PhButton,
  PhDialog,
  PhRadioGroup,
  PhTextField,
  PhTextarea,
  RadioOption,
} from '@promisehub/components';

/** Edit a child's medical details (dialog: edit-medical). The change is audited. Closes with true once saved. */
@Component({
  selector: 'ph-edit-medical-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhRadioGroup, PhTextField, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-medical-dialog.html',
})
export class EditMedicalDialog {
  private readonly api = inject(HOUSEHOLDS_API);
  protected readonly child = inject<Child>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly alertOptions: RadioOption[] = [
    { value: 'red', label: 'Red alert on the Quick Card', hint: 'Life-threatening' },
    { value: 'list', label: 'List it under Medical only' },
  ];
  protected changes: MedicalChanges = {
    allergies: this.child.medical?.allergies ?? '',
    medication: this.child.medical?.medication ?? '',
    conditions: this.child.medical?.conditions ?? '',
    doctor: this.child.medical?.doctor ?? '',
    redAlert: this.child.medical?.redAlert ?? false,
    alertInstruction: this.child.medical?.alertInstruction ?? '',
  };
  protected alert = this.changes.redAlert ? 'red' : 'list';
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.api
      .updateMedical(this.child.id, { ...this.changes, redAlert: this.alert === 'red' })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.ref.close(true);
        } else {
          this.error.set('We couldn’t save. Try again.');
        }
      });
  }
}
