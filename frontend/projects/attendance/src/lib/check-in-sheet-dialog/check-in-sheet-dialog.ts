import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RosterEntry } from '@promisehub/api';
import {
  PhButton,
  PhDialog,
  PhRadioGroup,
  PhTextField,
  RadioOption,
  formatTime,
} from '@promisehub/components';

export type CheckInSheetResult =
  { kind: 'check-in'; arrivedAt: string | null } | { kind: 'absent' } | undefined;

/** Check in a child (dialog: check-in-sheet): now, at an earlier time, or mark absent instead. */
@Component({
  selector: 'ph-check-in-sheet-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhRadioGroup, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './check-in-sheet-dialog.html',
})
export class CheckInSheetDialog {
  protected readonly entry = inject<RosterEntry>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<CheckInSheetResult>>(DialogRef);

  protected arrived = 'now';
  protected earlier = '';
  protected readonly error = signal<string | null>(null);
  protected readonly options: RadioOption[] = [
    { value: 'now', label: `Now, ${formatTime(new Date())}` },
    { value: 'earlier', label: 'Earlier', hint: 'Pick a time' },
    { value: 'absent', label: 'Mark absent instead' },
  ];

  protected submit(): void {
    if (this.arrived === 'absent') {
      this.ref.close({ kind: 'absent' });
    } else if (this.arrived === 'earlier') {
      if (!this.earlier) {
        this.error.set('Pick the time they arrived.');
        return;
      }
      const [h, m] = this.earlier.split(':').map(Number);
      const at = new Date();
      at.setHours(h!, m!, 0, 0);
      this.ref.close({ kind: 'check-in', arrivedAt: at.toISOString() });
    } else {
      this.ref.close({ kind: 'check-in', arrivedAt: null });
    }
  }
}
