import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { REPORTS_API, ReportExport } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';

/** What the export covers. */
export interface ExportDialogData {
  programId: string | null;
}

/** Export (mock: export-data): writes the report as CSV and offers a link that works for seven days. */
@Component({
  selector: 'ph-export-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './export-dialog.html',
})
export class ExportDialog {
  private readonly api = inject(REPORTS_API);
  private readonly data = inject<ExportDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<void>>(DialogRef);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly ready = signal<ReportExport | null>(null);

  protected exportCsv(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.export(this.data.programId).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'loaded') this.ready.set(r.value);
      else this.failed.set(true);
    });
  }

  protected url(id: string): string {
    return this.api.downloadUrl(id);
  }
}
