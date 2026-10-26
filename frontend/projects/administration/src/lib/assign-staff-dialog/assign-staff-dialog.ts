import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Coverage, ROLE_LABELS, STAFF_API } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhCheckbox,
  PhDialog,
  PhList,
  PhListItem,
} from '@promisehub/components';

export interface AssignStaffData {
  session: Coverage['sessions'][number];
  people: Coverage['people'];
}

/** Assign staff to a session (dialog on page: coverage): everyone ticked works it; youth workers then run it. Closes with true. */
@Component({
  selector: 'ph-assign-staff-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhCheckbox, PhDialog, PhList, PhListItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './assign-staff-dialog.html',
})
export class AssignStaffDialog {
  private readonly api = inject(STAFF_API);
  protected readonly data = inject<AssignStaffData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly chosen = new Set(this.data.session.staff.map((s) => s.id));
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected toggle(id: string, on: boolean): void {
    if (on) this.chosen.add(id);
    else this.chosen.delete(id);
  }

  protected save(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.assign(this.data.session.id, [...this.chosen]).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.ref.close(true);
      else this.failed.set(true);
    });
  }
}
