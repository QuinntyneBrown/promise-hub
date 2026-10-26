import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role, STAFF_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhRadioGroup, PhTextField } from '@promisehub/components';
import { ROLE_OPTIONS } from '../role-labels';

/** Invite staff (dialog: invite-staff): a work email and a role; the invitation is emailed and lasts 14 days. Closes with true. */
@Component({
  selector: 'ph-invite-staff-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invite-staff-dialog.html',
})
export class InviteStaffDialog {
  private readonly api = inject(STAFF_API);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected email = '';
  protected role: Role = 'YouthWorker';
  /** Coordinators invite youth workers only (L2-009 criterion 8); admins choose any role. */
  private readonly data = inject<{ youthWorkersOnly: boolean } | null>(DIALOG_DATA, {
    optional: true,
  });
  protected readonly roles = this.data?.youthWorkersOnly
    ? ROLE_OPTIONS.filter((r) => r.value === 'YouthWorker')
    : ROLE_OPTIONS;
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.invite(this.email, this.role).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
