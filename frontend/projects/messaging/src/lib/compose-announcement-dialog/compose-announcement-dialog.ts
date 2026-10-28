import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ANNOUNCEMENTS_API, AnnouncementAudience } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhDialog,
  PhErrorSummary,
  PhRadioGroup,
  PhSelect,
  PhTextField,
  PhTextarea,
  RadioOption,
  SelectOption,
} from '@promisehub/components';
import { AUDIENCE_OPTIONS } from '../audience-words';
import { ComposeAnnouncementData } from '../compose-announcement-data';
import { ComposeAnnouncementResult } from '../compose-announcement-result';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = {
  title: 'ann-title',
  body: 'ann-body',
  audience: 'ann-audience',
  sendAt: 'ann-date',
};

/**
 * New announcement (dialog: compose-announcement, L2-105 criteria 1, 2 and 4): title, message, the program (or all), who hears it and
 * when. Shows the server's errors by field; closes with the title and, when scheduled, the time it goes.
 */
@Component({
  selector: 'ph-compose-announcement-dialog',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhDialog,
    PhErrorSummary,
    PhRadioGroup,
    PhSelect,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './compose-announcement-dialog.html',
})
export class ComposeAnnouncementDialog {
  private readonly api = inject(ANNOUNCEMENTS_API);
  private readonly data = inject<ComposeAnnouncementData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<ComposeAnnouncementResult>>(DialogRef);

  protected readonly programOptions: SelectOption[] = [
    { value: '', label: 'All programs' },
    ...this.data.programs,
  ];
  protected readonly audiences = AUDIENCE_OPTIONS;
  protected readonly whenOptions: RadioOption[] = [
    { value: 'now', label: 'Send now' },
    { value: 'later', label: 'Schedule for later' },
  ];

  protected readonly title = signal('');
  protected readonly body = signal('');
  protected readonly programId = signal('');
  protected readonly audience = signal('');
  protected readonly when = signal('now');
  protected readonly date = signal('');
  protected readonly time = signal('09:00');

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: FIELD[key] ?? key, message })),
  );

  protected count(value: string): string {
    return `${value.length.toLocaleString('en-US')} / 2,000`;
  }

  protected send(): void {
    if (this.busy()) return;
    const missing: Record<string, string> = {};
    if (!this.title().trim()) missing['title'] = 'Give it a title.';
    if (!this.body().trim()) missing['body'] = 'Write the announcement.';
    if (!this.audience()) missing['audience'] = 'Choose who hears it.';
    if (this.when() === 'later' && !this.date()) missing['sendAt'] = 'Choose the date.';
    this.errors.set(missing);
    if (Object.keys(missing).length) return;
    const sendAt =
      this.when() === 'later'
        ? new Date(`${this.date()}T${this.time() || '09:00'}`).toISOString()
        : null;
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .compose({
        title: this.title().trim(),
        body: this.body().trim(),
        programId: this.programId() || null,
        audience: this.audience() as AnnouncementAudience,
        sendAt,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.ref.close({ title: this.title().trim(), scheduledFor: sendAt });
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
