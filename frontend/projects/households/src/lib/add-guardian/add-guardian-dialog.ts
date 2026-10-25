import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOUSEHOLDS_API, Household, NewGuardian } from '@promisehub/api';
import {
  PhButton,
  PhDialog,
  PhSelect,
  PhSwitch,
  PhTextField,
  ToastService,
} from '@promisehub/components';
import { LANGUAGES, RELATIONSHIPS } from '../relationships';

/** Add a guardian to a household (dialog: add-guardian). Closes with true once added. */
@Component({
  selector: 'ph-add-guardian-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhSelect, PhSwitch, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-guardian-dialog.html',
})
export class AddGuardianDialog {
  private readonly api = inject(HOUSEHOLDS_API);
  private readonly toasts = inject(ToastService);
  protected readonly household = inject<Household>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly relationships = RELATIONSHIPS;
  protected readonly languages = LANGUAGES;
  protected guardian: NewGuardian = {
    name: '',
    relationship: 'Guardian',
    mobile: '',
    email: '',
    language: this.household.language,
    canPickUp: true,
    canSign: false,
  };
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.api.addGuardian(this.household.id, this.guardian).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({ tone: 'success', title: 'Guardian added', text: this.guardian.name });
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.errors.set({ name: 'We couldn’t add the guardian. Try again.' });
      }
    });
  }
}
