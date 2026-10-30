import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LEARNING_BOND_API, LearningBondExportCreated } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhSelect, SelectOption } from '@promisehub/components';

/**
 * Export for funders (export-learning-bond, L2-143): one row per covered program and a total, counts under 5 read "<5" and their dollars are
 * blank, no family named; the file is kept 7 days.
 */
@Component({
  selector: 'ph-learning-bond-export-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-export-dialog.html',
})
export class LearningBondExportDialog {
  protected readonly api = inject(LEARNING_BOND_API);
  protected readonly data = inject<{ period: string }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected period = this.data.period;
  protected readonly periods: SelectOption[] = [
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ];
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly ready = signal<LearningBondExportCreated | null>(null);

  protected export(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api.exportForFunders(this.period).subscribe((created) => {
      this.busy.set(false);
      if (created) this.ready.set(created);
      else this.failed.set(true);
    });
  }
}
