import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MentoringSettings, ORGANIZATION_SETTINGS_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhSelect, SelectOption } from '@promisehub/components';

/** Edit mentoring defaults (dialog: mentoring-defaults, L2-125): how often mentors check in. Closes with true once saved. */
@Component({
  selector: 'ph-mentoring-defaults-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentoring-defaults-dialog.html',
})
export class MentoringDefaultsDialog {
  private readonly api = inject(ORGANIZATION_SETTINGS_API);
  private readonly current = inject<MentoringSettings>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly cadences: SelectOption[] = [7, 14, 21, 30].map((d) => ({
    value: String(d),
    label: `Every ${d} days`,
  }));
  protected days = String(this.current.checkInEveryDays);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.saveMentoring({ checkInEveryDays: Number(this.days) }).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
