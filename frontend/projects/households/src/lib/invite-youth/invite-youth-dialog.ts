import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Child, STAFF_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhTextField } from '@promisehub/components';

/**
 * Invite a youth (dialog: invite-youth, L2-051): the youth's own email; the account links to this child and the link lasts
 * 14 days. Closes with true once sent.
 */
@Component({
  selector: 'ph-invite-youth-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invite-youth-dialog.html',
})
export class InviteYouthDialog {
  private readonly api = inject(STAFF_API);
  protected readonly child = inject<Child>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected email = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.inviteYouth(this.child.id, this.email).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
