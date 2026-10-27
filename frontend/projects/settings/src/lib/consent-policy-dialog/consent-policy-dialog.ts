import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConsentPolicy, PRIVACY_API } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhSelect,
  PhTextarea,
  SelectOption,
} from '@promisehub/components';

/** Edit consent policy (dialog: consent-policy, L2-056 criterion 1). Closes with true once saved. */
@Component({
  selector: 'ph-consent-policy-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhSelect, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consent-policy-dialog.html',
})
export class ConsentPolicyDialog {
  private readonly api = inject(PRIVACY_API);
  private readonly current = inject<ConsentPolicy>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly ages: SelectOption[] = [13, 14, 15, 16, 17, 18, 19].map((age) => ({
    value: String(age),
    label: `${age} years`,
  }));
  protected age = String(this.current.consentAge);
  protected wording = this.current.wording;
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .saveConsentPolicy({ consentAge: Number(this.age), wording: this.wording })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(true);
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else this.failed.set(true);
      });
  }
}
