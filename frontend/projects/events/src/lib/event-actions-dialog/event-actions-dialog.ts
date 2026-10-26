import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EventDetail } from '@promisehub/api';
import { ActionMenuItem, PhActionMenu, PhButton, PhDialog } from '@promisehub/components';

/** What was chosen in the actions menu; the page opens the matching dialog once this one has closed. */
export type EventAction = 'cancel';

/** More actions for an event (dialog: event-actions). Closes with the chosen action, so two dialogs are never open at once. */
@Component({
  selector: 'ph-event-actions-dialog',
  imports: [PhActionMenu, PhButton, PhDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-actions-dialog.html',
})
export class EventActionsDialog {
  protected readonly event = inject<EventDetail>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<EventAction>>(DialogRef);
  protected readonly items: ActionMenuItem[] = [
    { id: 'cancel', label: 'Cancel event…', danger: true },
  ];

  protected choose(id: string): void {
    if (id === 'cancel') this.ref.close('cancel');
  }
}
