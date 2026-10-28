import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MENTORING_API } from '@promisehub/api';
import {
  ErrorSummaryItem,
  Fact,
  PhAlert,
  PhButton,
  PhDescriptionList,
  PhDialog,
  PhErrorSummary,
  PhRadioGroup,
  PhTextarea,
} from '@promisehub/components';
import { OUTCOME_OPTIONS, raisedLine } from '../flag-words';
import { ResolveFlagDialogData } from '../resolve-flag-dialog-data';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = { outcome: 'flag-outcome', note: 'flag-note' };

/**
 * Resolves an at-risk flag (dialog: resolve-flag, L2-091 criterion 5): how it was resolved and an optional note. Checks the outcome here,
 * shows the server's errors by field or that the flag was resolved meanwhile; closes with the youth's name once resolved.
 */
@Component({
  selector: 'ph-resolve-flag-dialog',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhDescriptionList,
    PhDialog,
    PhErrorSummary,
    PhRadioGroup,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resolve-flag-dialog.html',
})
export class ResolveFlagDialog {
  private readonly api = inject(MENTORING_API);
  protected readonly data = inject<ResolveFlagDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected readonly outcomes = OUTCOME_OPTIONS;
  protected readonly facts: Fact[] = [
    { key: 'youth', term: 'Youth', value: this.data.flag.youthName },
    {
      key: 'flag',
      term: 'Flag',
      value: `${this.data.flag.severity} · ${raisedLine(this.data.flag)}`,
    },
  ];

  protected readonly outcome = signal('');
  protected readonly note = signal('');

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly alreadyResolved = signal(false);
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
    if (!this.outcome()) missing['outcome'] = 'Choose how it was resolved.';
    this.errors.set(missing);
    if (Object.keys(missing).length) return;
    this.busy.set(true);
    this.failed.set(false);
    this.alreadyResolved.set(false);
    this.api
      .resolveFlag(this.data.flag.id, { outcome: this.outcome(), note: this.note().trim() || null })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.ref.close(this.data.flag.youthName);
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else if (outcome.status === 'already-resolved') {
          this.alreadyResolved.set(true);
        } else {
          this.failed.set(true);
        }
      });
  }
}
