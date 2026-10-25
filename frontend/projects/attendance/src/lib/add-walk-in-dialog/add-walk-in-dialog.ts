import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ATTENDANCE_API, NewWalkIn, SessionSummary } from '@promisehub/api';
import { PhButton, PhDialog, PhTextField, PhTextarea, ToastService } from '@promisehub/components';

/** Add a walk-in to tonight (dialog: add-walk-in): tonight only, checked in, flagged for the office. */
@Component({
  selector: 'ph-add-walk-in-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhTextField, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-walk-in-dialog.html',
})
export class AddWalkInDialog {
  private readonly api = inject(ATTENDANCE_API);
  private readonly toasts = inject(ToastService);
  protected readonly data = inject<{ session: SessionSummary; name: string }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected walkIn: NewWalkIn = { childName: '', guardian: '', medicalNotes: '' };
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.api.addWalkIn(this.data.session.id, this.walkIn).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: `${this.walkIn.childName} checked in`,
          text: 'Walk-in for tonight; the office follows up.',
        });
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.errors.set({ childName: 'We couldn’t add the walk-in. Try again.' });
      }
    });
  }
}
