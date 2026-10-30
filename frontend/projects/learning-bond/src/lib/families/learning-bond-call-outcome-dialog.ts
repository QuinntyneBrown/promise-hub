import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LEARNING_BOND_API, LearningBondFamily } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhRadioGroup, RadioOption } from '@promisehub/components';

/**
 * Mark the call with {guardian} done (dialog: learning-bond-call-outcome, L2-142 criterion 4): Resumed, Not interested or No answer, which
 * keeps the household at Call requested to try again. Closes with true once recorded.
 */
@Component({
  selector: 'ph-learning-bond-call-outcome-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-call-outcome-dialog.html',
})
export class LearningBondCallOutcomeDialog {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly family = inject<LearningBondFamily>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly outcomes: RadioOption[] = [
    { value: 'Resumed', label: 'Resumed', hint: 'They carry on from their link.' },
    {
      value: 'NotInterested',
      label: 'Not interested',
      hint: 'No more texts about the Learning Bond.',
    },
    { value: 'NoAnswer', label: 'No answer', hint: 'Stays as Call requested; try again later.' },
  ];
  protected outcome = 'Resumed';
  protected readonly error = signal<string | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected title(): string {
    return `Mark the call with ${this.family.guardian ?? 'the ' + this.family.name + ' household'} done`;
  }

  protected description(): string {
    const when = this.family.callWhen ? ` · ${this.family.callWhen.toLowerCase()}` : '';
    return `${this.family.callPhone ?? ''}${when}.`;
  }

  protected save(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api.recordCall(this.family.householdId, this.outcome).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'saved') this.ref.close(true);
      else if (r.status === 'invalid') this.error.set(r.errors['outcome'] ?? null);
      else this.failed.set(true);
    });
  }
}
