import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Program } from '@promisehub/api';
import {
  ActionMenuItem,
  PhActionMenu,
  PhButton,
  PhDialog,
  PhDialogs,
} from '@promisehub/components';
import { ArchiveProgramDialog } from '../archive-program-dialog/archive-program-dialog';

/** More actions for a program (dialog: program-actions). Closes with true when the program changed. */
@Component({
  selector: 'ph-program-actions-dialog',
  imports: [PhActionMenu, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './program-actions-dialog.html',
})
export class ProgramActionsDialog {
  private readonly dialogs = inject(PhDialogs);
  protected readonly program = inject<Program>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly items: ActionMenuItem[] = [
    { id: 'archive', label: 'Archive program…', danger: true },
  ];

  protected choose(id: string): void {
    if (id === 'archive') {
      this.dialogs
        .open<boolean, Program, ArchiveProgramDialog>(ArchiveProgramDialog, this.program)
        .closed.subscribe((archived) => this.ref.close(!!archived));
    }
  }
}
