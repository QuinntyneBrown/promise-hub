import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOUSEHOLDS_API, Household } from '@promisehub/api';
import {
  PhButton,
  PhDialog,
  PhRadioGroup,
  PhTextField,
  RadioOption,
  ToastService,
} from '@promisehub/components';

/** Delete a household (dialog: delete-household): a reason and the household's name typed to confirm. */
@Component({
  selector: 'ph-delete-household-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhRadioGroup, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delete-household-dialog.html',
})
export class DeleteHouseholdDialog {
  private readonly api = inject(HOUSEHOLDS_API);
  private readonly toasts = inject(ToastService);
  protected readonly household = inject<Household>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly reasons: RadioOption[] = [
    { value: 'Guardian asked (right to deletion)', label: 'Guardian asked (right to deletion)' },
    { value: 'Duplicate household', label: 'Duplicate household' },
    { value: 'Created by mistake', label: 'Created by mistake' },
  ];
  protected reason = this.reasons[0]!.value;
  protected readonly confirmName = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected matches(): boolean {
    return this.confirmName().trim().toLowerCase() === this.household.name.toLowerCase();
  }

  protected submit(): void {
    if (!this.matches()) {
      return;
    }
    this.busy.set(true);
    this.api.delete(this.household.id, this.reason, this.confirmName()).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: `${this.household.name} household deleted`,
          text: 'Purged in 30 days.',
        });
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.error.set(outcome.errors['confirmName'] ?? 'Type the household name to confirm.');
      } else {
        this.error.set('We couldn’t delete the household. Try again.');
      }
    });
  }
}
