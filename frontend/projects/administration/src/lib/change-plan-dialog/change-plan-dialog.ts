import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BILLING_API, Billing } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhRadioGroup, RadioOption } from '@promisehub/components';

/** Change plan (mock: change-plan): pick Free, Standard or Plus; the difference is prorated for the rest of the month. */
@Component({
  selector: 'ph-change-plan-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-plan-dialog.html',
})
export class ChangePlanDialog {
  private readonly api = inject(BILLING_API);
  protected readonly data = inject<Billing>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<{ plan: string; proratedCharge: number }>>(DialogRef);

  protected readonly options: RadioOption[] = [
    { value: 'Free', label: 'Free · up to 50 children · 200 texts a month' },
    { value: 'Standard', label: 'Standard · $89 a month · 500 children · 2,000 texts' },
    { value: 'Plus', label: 'Plus · $149 a month · 2,000 children · 5,000 texts' },
  ];
  protected plan: string = this.data.plan;
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly failed = signal(false);

  protected save(): void {
    this.busy.set(true);
    this.error.set(null);
    this.failed.set(false);
    this.api.changePlan(this.plan as Billing['plan']).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'changed')
        this.ref.close({ plan: r.plan, proratedCharge: r.proratedCharge });
      else if (r.status === 'invalid') this.error.set(r.message);
      else this.failed.set(true);
    });
  }
}
