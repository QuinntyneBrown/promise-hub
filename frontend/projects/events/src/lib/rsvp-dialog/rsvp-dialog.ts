import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Rsvp, RsvpResponse, SCHEDULE_API, ScheduleSession } from '@promisehub/api';
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
  formatWhen,
} from '@promisehub/components';
import { RSVP_OPTIONS } from '../rsvp-words';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = { response: 'rsvp-response', note: 'rsvp-note' };

/**
 * A youth answers for a session (dialog: rsvp, L2-094 criteria 2 and 3): Going, Maybe or Can't make it and an optional note for staff.
 * Checks the answer here and shows the server's errors by field, a failed send, or that RSVPs closed; closes with the saved answer, or
 * with 'closed' so the schedule reloads.
 */
@Component({
  selector: 'ph-rsvp-dialog',
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
  templateUrl: './rsvp-dialog.html',
})
export class RsvpDialog {
  private readonly api = inject(SCHEDULE_API);
  protected readonly session = inject<ScheduleSession>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<Rsvp | 'closed'>>(DialogRef);

  protected readonly options = RSVP_OPTIONS;
  protected readonly response = signal<string>(this.session.response ?? '');
  protected readonly note = signal(this.session.note ?? '');
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly closed = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: FIELD[key] ?? key, message })),
  );
  protected readonly facts: Fact[] = [
    { key: 'session', term: 'Session', value: this.session.name },
    { key: 'when', term: 'When', value: formatWhen(this.session.startsAt, this.session.endsAt) },
    ...(this.session.place ? [{ key: 'where', term: 'Where', value: this.session.place }] : []),
  ];

  protected count(value: string): string {
    return `${value.length} / 500`;
  }

  protected close(): void {
    this.ref.close(this.closed() ? 'closed' : undefined);
  }

  protected send(): void {
    if (this.busy() || this.closed()) return;
    if (!this.response()) {
      this.errors.set({ response: 'Choose whether you’re going.' });
      return;
    }
    this.errors.set({});
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .rsvp(this.session.eventId, {
        response: this.response() as RsvpResponse,
        note: this.note().trim() || null,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'sent') {
          this.ref.close(outcome.rsvp);
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else if (outcome.status === 'closed') {
          this.closed.set(true);
        } else {
          this.failed.set(true);
        }
      });
  }
}
