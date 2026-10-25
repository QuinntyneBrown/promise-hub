import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ENROLLMENT_API, EnrollmentRequest } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextarea } from '@promisehub/components';

export interface MoveInData {
  request: EnrollmentRequest;
  places: string;
}

/** Move a waitlisted child in (dialog: move-in): the child is enrolled, the guardian texted and the others move up. Closes with true. */
@Component({
  selector: 'ph-move-in-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './move-in-dialog.html',
})
export class MoveInDialog {
  private readonly api = inject(ENROLLMENT_API);
  protected readonly data = inject<MoveInData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected note = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly first = this.data.request.guardian.split(' ')[0] ?? '';

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .review(this.data.request.id, 'Accept', this.note.trim() || null)
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') this.ref.close(true);
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else this.failed.set(true);
      });
  }
}
