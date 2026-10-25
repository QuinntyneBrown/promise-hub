import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { INCIDENTS_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextarea } from '@promisehub/components';

/** Add a follow-up to an incident (dialog: add-follow-up); allowed after it is closed. Closes with true. */
@Component({
  selector: 'ph-add-follow-up-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-follow-up-dialog.html',
})
export class AddFollowUpDialog {
  private readonly api = inject(INCIDENTS_API);
  protected readonly data = inject<{ id: string }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected text = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.addFollowUp(this.data.id, this.text).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
