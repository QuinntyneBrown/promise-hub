import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EVENTS_API, EventDetail } from '@promisehub/api';
import { PhButton, PhDialog, PhSwitch, PhTextarea, ToastService } from '@promisehub/components';

/** Cancel an event (dialog: cancel-event): the message to guardians; the event is kept as cancelled. */
@Component({
  selector: 'ph-cancel-event-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhSwitch, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cancel-event-dialog.html',
})
export class CancelEventDialog {
  private readonly api = inject(EVENTS_API);
  private readonly toasts = inject(ToastService);
  protected readonly event = inject<EventDetail>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected message = '';
  protected tellGuardians = true;
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.api.cancel(this.event.id, this.message, this.tellGuardians).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: `${this.event.name} cancelled`,
          text: 'Signed slips are kept.',
        });
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.error.set(outcome.errors['message'] ?? 'Write the message to guardians.');
      } else {
        this.error.set('We couldn’t cancel the event. Try again.');
      }
    });
  }
}
