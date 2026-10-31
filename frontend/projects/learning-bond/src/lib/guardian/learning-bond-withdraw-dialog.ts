import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GuardianLearningBondConsent, LEARNING_BOND_API } from '@promisehub/api';
import { Fact, PhAlert, PhButton, PhDescriptionList, PhDialog } from '@promisehub/components';
import { GuardianLearningBondText } from './guardian-learning-bond-text';

/** The data Withdraw needs: the link, the consent with its child and provider, and the page's words. */
export interface LearningBondWithdrawData {
  token: string;
  consent: GuardianLearningBondConsent;
  text: GuardianLearningBondText;
}

/**
 * Withdraw consent for a child (withdraw-learning-bond-consent, L2-152 criterion 1): what stops and what stays, with the provider named;
 * focus starts on Cancel. Closes with true once withdrawn.
 */
@Component({
  selector: 'ph-learning-bond-withdraw-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDescriptionList, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-withdraw-dialog.html',
})
export class LearningBondWithdrawDialog {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly data = inject<LearningBondWithdrawData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly facts: Fact[] = [
    {
      key: 'stops',
      term: this.data.text.withdrawStops,
      value: this.data.text.withdrawStopsText(this.data.consent.firstName),
    },
    {
      key: 'stays',
      term: this.data.text.withdrawStays,
      value: this.data.text.withdrawStaysText(this.data.consent.provider),
    },
  ];

  protected withdraw(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api.withdrawConsent(this.data.token, this.data.consent.id).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'saved') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
