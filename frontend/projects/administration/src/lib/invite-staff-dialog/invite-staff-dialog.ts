import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Role, SESSION_API, STAFF_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhRadioGroup, PhTextField } from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';
import { INVITE_ROLE_OPTIONS } from '../role-labels';

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
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  /** Mentor is offered only while Mentoring is on (L2-051 criterion 5). */
  protected readonly roles = computed(() =>
    this.data?.youthWorkersOnly
      ? INVITE_ROLE_OPTIONS.filter((r) => r.value === 'YouthWorker')
      : INVITE_ROLE_OPTIONS.filter(
          (r) => r.value !== 'Mentor' || !!this.session()?.modules.includes('Mentoring'),
        ),
  );
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
