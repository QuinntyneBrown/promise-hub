import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PROGRAMS_API, Program } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog } from '@promisehub/components';

/** Close enrollment (dialog: close-enrollment): the link shows a closed message; children who applied stay waiting for review. */
@Component({
  selector: 'ph-close-enrollment-dialog',
  imports: [PhAlert, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './close-enrollment-dialog.html',
})
export class CloseEnrollmentDialog {
  private readonly api = inject(PROGRAMS_API);
  protected readonly program = inject<Program>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected close(): void {
    this.busy.set(true);
    this.api.closeEnrollment(this.program.id).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
