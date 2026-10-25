import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EventDetail } from '@promisehub/api';
import {
  ActionMenuItem,
  PhActionMenu,
  PhButton,
  PhDialog,
  PhDialogs,
} from '@promisehub/components';
import { CancelEventDialog } from '../cancel-event-dialog/cancel-event-dialog';

/** More actions for an event (dialog: event-actions). Closes with true when the event changed. */
@Component({
  selector: 'ph-event-actions-dialog',
  imports: [PhActionMenu, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-actions-dialog.html',
})
export class EventActionsDialog {
  private readonly dialogs = inject(PhDialogs);
  protected readonly event = inject<EventDetail>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly items: ActionMenuItem[] = [
    { id: 'cancel', label: 'Cancel event…', danger: true },
  ];

  protected choose(id: string): void {
    if (id === 'cancel') {
      this.dialogs
        .open<boolean, EventDetail, CancelEventDialog>(CancelEventDialog, this.event)
        .closed.subscribe((cancelled) => this.ref.close(!!cancelled));
    }
  }
}
