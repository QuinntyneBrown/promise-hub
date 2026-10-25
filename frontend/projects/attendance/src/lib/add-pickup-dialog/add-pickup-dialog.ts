import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NewPickup, PICKUP_API } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhRadioGroup,
  PhTextField,
  RadioOption,
} from '@promisehub/components';

export interface AddPickupData {
  childId: string;
  firstName: string;
}

/** Add an approved adult (dialog: add-pickup) for the child, or for every child of the household. Closes with true. */
@Component({
  selector: 'ph-add-pickup-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-pickup-dialog.html',
})
export class AddPickupDialog {
  private readonly api = inject(PICKUP_API);
  protected readonly data = inject<AddPickupData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly pickup: NewPickup = {
    name: '',
    relationship: '',
    mobile: null,
    siblings: false,
  };
  protected appliesTo = 'one';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly scopes: RadioOption[] = [
    { value: 'one', label: `${this.data.firstName} only` },
    { value: 'all', label: 'All the family’s children' },
  ];

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .add(this.data.childId, {
        ...this.pickup,
        mobile: this.pickup.mobile || null,
        siblings: this.appliesTo === 'all',
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(true);
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else this.failed.set(true);
      });
  }
}
