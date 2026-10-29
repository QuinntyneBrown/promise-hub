import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { REPORTS_API, ReportExport, ReportExportRequest } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';

/** What a detailed report exports and how the dialog names it. */
export interface ExportReportDialogData {
  request: ReportExportRequest;
  title: string;
  description: string;
}

/** Export a detailed report (mock: export-report, L2-129): a CSV of exactly what the report shows, logged, with a link that lasts 7 days. */
@Component({
  selector: 'ph-export-report-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './export-report-dialog.html',
})
export class ExportReportDialog {
  private readonly api = inject(REPORTS_API);
  protected readonly data = inject<ExportReportDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<void>>(DialogRef);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly ready = signal<ReportExport | null>(null);

  protected exportCsv(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.exportReport(this.data.request).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'loaded') this.ready.set(r.value);
      else this.failed.set(true);
    });
  }

  protected url(id: string): string {
    return this.api.downloadUrl(id);
  }
}
