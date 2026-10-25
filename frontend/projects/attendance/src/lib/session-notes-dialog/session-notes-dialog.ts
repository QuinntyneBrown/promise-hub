import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ATTENDANCE_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextarea } from '@promisehub/components';

/** Session notes (dialog: session-notes) for the next site lead or the director; allowed after the session ends. Closes with true. */
@Component({
  selector: 'ph-session-notes-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-notes-dialog.html',
})
export class SessionNotesDialog {
  private readonly api = inject(ATTENDANCE_API);
  protected readonly data = inject<{ sessionId: string; notes: string | null; incidents: boolean }>(
    DIALOG_DATA,
  );
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected notes = this.data.notes ?? '';
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected save(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.saveNotes(this.data.sessionId, this.notes).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
