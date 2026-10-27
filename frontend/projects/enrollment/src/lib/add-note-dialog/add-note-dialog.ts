import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { APPLICATIONS_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextarea } from '@promisehub/components';

export interface AddNoteData {
  applicationId: string;
}

/** Add a staff note to an application (dialog: add-application-note, L2-072 criterion 3). Closes with true once saved. */
@Component({
  selector: 'ph-add-note-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-note-dialog.html',
})
export class AddNoteDialog {
  private readonly api = inject(APPLICATIONS_API);
  protected readonly data = inject<AddNoteData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly text = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly count = computed(
    () => `${this.text().length.toLocaleString('en-CA')} / 2,000`,
  );

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.error.set(null);
    this.api.addNote(this.data.applicationId, this.text()).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.error.set(outcome.errors['text'] ?? null);
      else this.failed.set(true);
    });
  }
}
