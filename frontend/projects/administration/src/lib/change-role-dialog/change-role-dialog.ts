import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Role, SESSION_API, STAFF_API } from '@promisehub/api';
import { PhAlert, PhButton, PhDialog, PhRadioGroup } from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';
import { INVITE_ROLE_OPTIONS, PARTICIPANT_ROLES } from '../role-labels';

/**
 * Change a person's role (dialog: change-role): the staff roles, Volunteer and, while Mentoring is on, Mentor; never Youth. Moving a
 * mentor or volunteer to a staff role warns that it opens every family's records (L2-113). It applies on their next action.
 * Closes with true.
 */
@Component({
  selector: 'ph-change-role-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhRadioGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-role-dialog.html',
})
export class ChangeRoleDialog {
  private readonly api = inject(STAFF_API);
  protected readonly data = inject<{ id: string; name: string; role: Role }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  protected readonly role = signal<Role>(this.data.role);
  protected readonly roles = computed(() =>
    INVITE_ROLE_OPTIONS.filter(
      (r) => r.value !== 'Mentor' || !!this.session()?.modules.includes('Mentoring'),
    ),
  );
  /** A mentor or volunteer moving to a staff role starts reading every family's records. */
  protected readonly widens = computed(
    () => PARTICIPANT_ROLES.includes(this.data.role) && !PARTICIPANT_ROLES.includes(this.role()),
  );
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected submit(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.changeRole(this.data.id, this.role()).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
