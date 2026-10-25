import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { INCIDENTS_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';

/** Reopen a closed incident (dialog: reopen-incident); the review note is kept. Closes with true. */
@Component({
  selector: 'ph-reopen-incident-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reopen-incident-dialog.html',
})
export class ReopenIncidentDialog {
  private readonly api = inject(INCIDENTS_API);
  protected readonly data = inject<{ id: string }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected reopen(): void {
    this.busy.set(true);
    this.api.reopen(this.data.id).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
