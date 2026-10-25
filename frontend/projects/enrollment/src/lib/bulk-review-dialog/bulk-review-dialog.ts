import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ENROLLMENT_API, EnrollmentRequest } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhList,
  PhListItem,
  PhTextarea,
} from '@promisehub/components';

export interface BulkReviewData {
  requests: EnrollmentRequest[];
  decision: 'Accept' | 'Waitlist';
}

/** Review several enrollments at once (dialog: bulk-review); every guardian is texted. Closes with true when done. */
@Component({
  selector: 'ph-bulk-review-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhList, PhListItem, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bulk-review-dialog.html',
})
export class BulkReviewDialog {
  private readonly api = inject(ENROLLMENT_API);
  protected readonly data = inject<BulkReviewData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected note = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .bulk(
        this.data.requests.map((r) => r.id),
        this.data.decision,
        this.note.trim() || null,
      )
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(true);
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else this.failed.set(true);
      });
  }
}
