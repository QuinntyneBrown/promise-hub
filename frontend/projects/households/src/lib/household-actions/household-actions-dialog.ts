import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Household } from '@promisehub/api';
import {
  ActionMenuItem,
  PhActionMenu,
  PhButton,
  PhDialog,
  PhDialogs,
} from '@promisehub/components';
import { DeleteHouseholdDialog } from '../delete-household/delete-household-dialog';

/** More actions for a household (dialog: household-actions). Closes with 'deleted' after a deletion. */
@Component({
  selector: 'ph-household-actions-dialog',
  imports: [PhActionMenu, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './household-actions-dialog.html',
})
export class HouseholdActionsDialog {
  private readonly dialogs = inject(PhDialogs);
  protected readonly data = inject<{ household: Household; canDelete: boolean }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<'deleted' | undefined>>(DialogRef);

  protected readonly items: ActionMenuItem[] = [
    { id: 'families', label: 'Back to Families' },
    ...(this.data.canDelete ? [{ id: 'delete', label: 'Delete household…', danger: true }] : []),
  ];

  protected choose(id: string): void {
    if (id === 'delete') {
      this.dialogs
        .open<boolean, Household, DeleteHouseholdDialog>(DeleteHouseholdDialog, this.data.household)
        .closed.subscribe((deleted) => this.ref.close(deleted ? 'deleted' : undefined));
    } else {
      this.ref.close();
    }
  }
}
