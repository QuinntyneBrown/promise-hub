import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MENTORING_API } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhDialog,
  PhErrorSummary,
  PhRadioGroup,
  PhSelect,
  PhTextarea,
  SelectOption,
} from '@promisehub/components';
import { SEVERITY_OPTIONS } from '../flag-words';
import { RaiseFlagDialogData } from '../raise-flag-dialog-data';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = {
  childId: 'flag-youth',
  severity: 'flag-severity',
  reason: 'flag-reason',
};

/**
 * Raises an at-risk flag (dialog: raise-flag, L2-091 criteria 1 and 2): the youth, how serious it is and why. Checks the required fields
 * here and shows the server's errors by field, or that the youth already has an open flag; closes with the youth's name once raised.
 */
@Component({
  selector: 'ph-raise-flag-dialog',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhDialog,
    PhErrorSummary,
    PhRadioGroup,
    PhSelect,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './raise-flag-dialog.html',
})
export class RaiseFlagDialog {
  private readonly api = inject(MENTORING_API);
  protected readonly data = inject<RaiseFlagDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected readonly severities = SEVERITY_OPTIONS;
  protected readonly youthOptions: SelectOption[] = [
    { value: '', label: 'Choose a youth' },
    ...this.data.youth.map((y) => ({ value: y.id, label: y.name })),
  ];

  protected readonly childId = signal('');
  protected readonly severity = signal('');
  protected readonly reason = signal('');

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  /** The youth's name when the server answered that she already has an open flag. */
  protected readonly alreadyFlagged = signal<string | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: FIELD[key] ?? key, message })),
  );

  protected count(value: string): string {
    return `${value.length.toLocaleString('en-US')} / 1,000`;
  }

  protected save(): void {
    if (this.busy()) return;
    const missing: Record<string, string> = {};
    if (!this.childId()) missing['childId'] = 'Choose a youth.';
    if (!this.severity()) missing['severity'] = 'Choose how serious it is.';
    if (!this.reason().trim()) missing['reason'] = 'Say why you’re worried.';
    this.errors.set(missing);
    this.alreadyFlagged.set(null);
    if (Object.keys(missing).length) return;
    this.busy.set(true);
    this.failed.set(false);
    const name = this.data.youth.find((y) => y.id === this.childId())?.name ?? '';
    this.api
      .raiseFlag({
        childId: this.childId(),
        severity: this.severity(),
        reason: this.reason().trim(),
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.ref.close(name);
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else if (outcome.status === 'already-flagged') {
          this.alreadyFlagged.set(name);
        } else {
          this.failed.set(true);
        }
      });
  }
}
