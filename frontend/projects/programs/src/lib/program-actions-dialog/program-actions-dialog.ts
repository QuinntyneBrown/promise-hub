import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Program } from '@promisehub/api';
import { ActionMenuItem, PhActionMenu, PhButton, PhDialog } from '@promisehub/components';

/**
 * More actions for a program (dialog: program-actions). Closes with the action chosen, so the page opens the next dialog
 * only after this one has gone: two dialogs are never open at once.
 */
@Component({
  selector: 'ph-program-actions-dialog',
  imports: [PhActionMenu, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './program-actions-dialog.html',
})
export class ProgramActionsDialog {
  protected readonly program = inject<Program>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<'archive'>>(DialogRef);
  protected readonly items: ActionMenuItem[] = [
    { id: 'archive', label: 'Archive program…', danger: true },
  ];

  protected choose(id: string): void {
    if (id === 'archive') this.ref.close('archive');
  }
}
