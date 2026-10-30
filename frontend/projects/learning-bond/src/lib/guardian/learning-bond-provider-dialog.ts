import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LEARNING_BOND_API, LearningBondApplication } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhRadioGroup, RadioOption } from '@promisehub/components';
import { GuardianLearningBondText } from './guardian-learning-bond-text';

/** The data Choose another needs: the application, the providers serving its province, the reason they're listed, and the page's words. */
export interface LearningBondProviderData {
  token: string;
  application: LearningBondApplication;
  text: GuardianLearningBondText;
}

/** Choose another (learning-bond-review/choose-another, L2-148 criterion 1): the platform's no-fee providers that serve the province. */
@Component({
  selector: 'ph-learning-bond-provider-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-provider-dialog.html',
})
export class LearningBondProviderDialog {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly data = inject<LearningBondProviderData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<LearningBondApplication>>(DialogRef);

  protected provider = this.data.application.provider ?? '';
  protected readonly options = computed<RadioOption[]>(() =>
    this.data.application.providers.map((p) => ({
      value: p,
      label: p,
      hint: this.data.application.reason,
    })),
  );
  protected readonly error = signal<string | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected use(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .chooseProvider(this.data.token, this.data.application.id, this.provider)
      .subscribe((r) => {
        this.busy.set(false);
        if (r.status === 'saved') this.ref.close(r.value);
        else if (r.status === 'invalid') this.error.set(r.errors['provider'] ?? null);
        else this.failed.set(true);
      });
  }
}
