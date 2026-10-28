import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PhButton,
  PhDialog,
  PhRadioGroup,
  PhTextField,
  RadioOption,
  formatTime,
} from '@promisehub/components';
import { CheckInSheetData } from './check-in-sheet-data';

export type CheckInSheetResult =
  | { kind: 'check-in'; arrivedAt: string | null; late: boolean }
  | { kind: 'absent'; excused: boolean }
  | undefined;

/**
 * Check in a child (dialog: check-in-sheet): now, at an earlier time, late, excused, or mark absent instead (L2-095). Late and
 * excused are offered only to those who may mark them; a volunteer sees Now, Earlier and Mark absent instead (L2-100).
 */
@Component({
  selector: 'ph-check-in-sheet-dialog',
  imports: [FormsModule, PhButton, PhDialog, PhRadioGroup, PhTextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './check-in-sheet-dialog.html',
})
export class CheckInSheetDialog {
  private readonly data = inject<CheckInSheetData>(DIALOG_DATA);
  protected readonly entry = this.data.entry;
  protected readonly ref = inject<DialogRef<CheckInSheetResult>>(DialogRef);

  protected arrived = 'now';
  protected earlier = '';
  protected readonly error = signal<string | null>(null);
  protected readonly options: RadioOption[] = [
    { value: 'now', label: `Now, ${formatTime(new Date())}` },
    { value: 'earlier', label: 'Earlier', hint: 'Pick a time' },
    ...(this.data.qualifiers
      ? [
          { value: 'late', label: 'Late', hint: 'Arrived after the start; counts as here' },
          { value: 'excused', label: 'Excused', hint: 'Not coming, and the reason is accepted' },
        ]
      : []),
    { value: 'absent', label: 'Mark absent instead' },
  ];

  protected submitLabel(): string {
    const labels: Record<string, string> = {
      absent: 'Mark absent',
      excused: 'Mark excused',
      late: 'Check in late',
    };
    return labels[this.arrived] ?? 'Check in';
  }

  protected submit(): void {
    if (this.arrived === 'absent' || this.arrived === 'excused') {
      this.ref.close({ kind: 'absent', excused: this.arrived === 'excused' });
    } else if (this.arrived === 'late') {
      this.ref.close({ kind: 'check-in', arrivedAt: null, late: true });
    } else if (this.arrived === 'earlier') {
      if (!this.earlier) {
        this.error.set('Pick the time they arrived.');
        return;
      }
      const [h, m] = this.earlier.split(':').map(Number);
      const at = new Date();
      at.setHours(h!, m!, 0, 0);
      this.ref.close({ kind: 'check-in', arrivedAt: at.toISOString(), late: false });
    } else {
      this.ref.close({ kind: 'check-in', arrivedAt: null, late: false });
    }
  }
}
