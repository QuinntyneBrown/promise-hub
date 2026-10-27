import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GradeOutcome, MENTORING_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextarea } from '@promisehub/components';
import { GradeDialogData } from '../grade-dialog-data';

/**
 * Sends a submission back with a note (dialog: request-revision, L2-080 criterion 5): the note is required, checked here and on the
 * server; closes with the outcome, and stays open with the failure when the call fails.
 */
@Component({
  selector: 'ph-request-revision-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './request-revision-dialog.html',
})
export class RequestRevisionDialog {
  private readonly api = inject(MENTORING_API);
  protected readonly data = inject<GradeDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<GradeOutcome>>(DialogRef);

  protected readonly note = signal(this.data.request.comment ?? '');
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected send(): void {
    const note = this.note().trim();
    if (!note) {
      this.error.set('Write what they should change.');
      return;
    }
    this.error.set(null);
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .grade(this.data.submissionId, { ...this.data.request, decision: 'revise', comment: note })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'error') this.failed.set(true);
        else if (outcome.status === 'invalid' && outcome.errors['comment'])
          this.error.set(outcome.errors['comment']);
        else this.ref.close(outcome);
      });
  }
}
