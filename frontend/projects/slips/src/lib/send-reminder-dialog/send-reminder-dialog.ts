import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SLIPS_API, UnsignedFamily } from '@promisehub/api';
import {
  PhAlert,
  PhBadge,
  PhButton,
  PhDialog,
  PhList,
  PhListItem,
  PhTextarea,
  formatDate,
} from '@promisehub/components';

export interface SendReminderData {
  slipId: string;
  body: string;
  families: UnsignedFamily[];
}

/** Text the unsigned (dialog: send-reminder): each family gets its own children's names and links. Closes with the number reminded. */
@Component({
  selector: 'ph-send-reminder-dialog',
  imports: [FormsModule, PhAlert, PhBadge, PhButton, PhDialog, PhList, PhListItem, PhTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './send-reminder-dialog.html',
})
export class SendReminderDialog {
  private readonly api = inject(SLIPS_API);
  protected readonly data = inject<SendReminderData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<number>>(DialogRef);

  protected body = this.data.body;
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly reachable = computed(
    () => this.data.families.filter((f) => f.reachable).length,
  );

  protected meta(f: UnsignedFamily): string {
    const parts = [f.children.join(', ')];
    if (!f.reachable && f.reason) parts.push(f.reason.toLowerCase());
    else if (f.lastRemindedAt) parts.push(`reminded ${formatDate(f.lastRemindedAt)}`);
    return parts.join(' · ');
  }

  protected send(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.remind(this.data.slipId, this.body).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'sent') this.ref.close(outcome.households);
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }
}
