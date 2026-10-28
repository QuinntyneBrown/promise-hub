import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ATTENDANCE_API, AttendanceMarkName, RosterEntry } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhDialog,
  PhErrorSummary,
  PhRadioGroup,
  PhSelect,
  PhTextarea,
  RadioOption,
  formatDay,
} from '@promisehub/components';
import { map } from 'rxjs';
import { CorrectAttendanceDialogData } from './correct-attendance-dialog-data';
import { CorrectAttendanceResult } from './correct-attendance-result';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = {
  childId: 'correct-youth',
  status: 'correct-status',
  reason: 'correct-reason',
};

/**
 * Corrects a youth's mark at a session (dialog: correct-attendance, L2-097 criteria 4 and 5): the youth with their current mark, the new
 * mark and why. The change and the reason are kept in the audit log.
 */
@Component({
  selector: 'ph-correct-attendance-dialog',
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
  templateUrl: './correct-attendance-dialog.html',
})
export class CorrectAttendanceDialog {
  private readonly api = inject(ATTENDANCE_API);
  protected readonly data = inject<CorrectAttendanceDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<CorrectAttendanceResult>>(DialogRef);

  protected readonly description = `${this.data.session.name} · ${formatDay(this.data.session.startsAt)} · ${this.data.programName}`;
  protected readonly marks: RadioOption[] = [
    { value: 'Present', label: 'Present', hint: 'Here on time' },
    { value: 'Late', label: 'Late', hint: 'Here, after the start' },
    { value: 'Excused', label: 'Excused', hint: 'Not here, reason accepted' },
    { value: 'Absent', label: 'Absent', hint: 'Not here' },
  ];

  /** The session's youth with their current mark, from its roster. */
  private readonly roster = toSignal(
    this.api
      .roster(this.data.session.eventId)
      .pipe(map((r) => (r.status === 'loaded' ? r.value.children.filter((c) => !!c.childId) : []))),
    { initialValue: [] as RosterEntry[] },
  );
  protected readonly youth = computed(() => [
    { value: '', label: 'Choose a youth' },
    ...this.roster().map((c) => ({ value: c.childId!, label: `${c.name} · ${this.markOf(c)}` })),
  ]);

  protected readonly childId = signal('');
  protected readonly status = signal('');
  protected readonly reason = signal('');
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: FIELD[key] ?? key, message })),
  );

  protected count(value: string): string {
    return `${value.length} / 500`;
  }

  private markOf(c: RosterEntry): string {
    if (c.status === 'Present' || c.status === 'SignedOut') return c.late ? 'Late' : 'Present';
    if (c.status === 'Absent') return c.excused ? 'Excused' : 'Absent';
    return 'Not recorded';
  }

  protected save(): void {
    if (this.busy()) return;
    const missing: Record<string, string> = {};
    if (!this.childId()) missing['childId'] = 'Choose a youth.';
    if (!this.status()) missing['status'] = 'Choose a mark.';
    if (!this.reason().trim()) missing['reason'] = 'Say why you’re correcting it.';
    this.errors.set(missing);
    if (Object.keys(missing).length) return;
    this.busy.set(true);
    this.failed.set(false);
    const mark = this.status() as AttendanceMarkName;
    this.api
      .correct(this.data.session.eventId, this.childId(), {
        status: mark,
        reason: this.reason().trim(),
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          const name = this.roster().find((c) => c.childId === this.childId())?.name ?? '';
          this.ref.close({ name, mark });
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
