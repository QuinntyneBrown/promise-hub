import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GUARDIAN_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextField } from '@promisehub/components';
import { HomeText } from '../home-text';

export interface GuardianPickupData {
  token: string;
  childId: string;
  child: string;
  text: HomeText;
  /** Set to remove this adult; otherwise the dialog adds one. */
  remove: { id: string; name: string } | null;
}

/** The family page's add or remove of an approved adult (dialogs: add-pickup, remove-pickup) in the household's language. Closes with true. */
@Component({
  selector: 'ph-guardian-pickup-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-pickup-dialog.html',
})
export class GuardianPickupDialog {
  private readonly api = inject(GUARDIAN_API);
  protected readonly data = inject<GuardianPickupData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected name = '';
  protected relationship = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    const call = this.data.remove
      ? this.api.removePickup(this.data.token, this.data.childId, this.data.remove.id)
      : this.api.addPickup(this.data.token, this.data.childId, {
          name: this.name,
          relationship: this.relationship,
          mobile: null,
          siblings: false,
        });
    call.subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
