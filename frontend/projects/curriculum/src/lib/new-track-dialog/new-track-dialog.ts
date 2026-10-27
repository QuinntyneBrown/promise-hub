import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API, NewTrack } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhSwitch,
  PhTextField,
  PhTextarea,
  ToastService,
} from '@promisehub/components';

/** Create a track (dialog: new-track, L2-066 criterion 2); a blank key is made from the name on the server. */
@Component({
  selector: 'ph-new-track-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhSwitch, PhTextField, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-track-dialog.html',
})
export class NewTrackDialog {
  private readonly api = inject(CURRICULUM_API);
  private readonly toasts = inject(ToastService);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected track: NewTrack = { name: '', key: '', description: '', publish: false };
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.createTrack(this.track).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: 'Track created',
          text: this.track.publish
            ? `${this.track.name.trim()} is published.`
            : `${this.track.name.trim()} is a draft until you publish it.`,
        });
        this.ref.close(true);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }
}
