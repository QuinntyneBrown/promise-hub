import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MENTORING_API } from '@promisehub/api';
import {
  ErrorSummaryItem,
  Fact,
  PhAlert,
  PhButton,
  PhCheckbox,
  PhDescriptionList,
  PhDialog,
  PhErrorSummary,
  PhRadioGroup,
  PhSelect,
  PhSwitch,
  PhTextField,
  PhTextarea,
  SelectOption,
} from '@promisehub/components';
import { ENGAGEMENT_OPTIONS, KIND_OPTIONS } from '../check-in-words';
import { MentorCheckInDialogData } from '../mentor-check-in-dialog-data';

/** The server's field names and the ids of the fields in the dialog, for the error summary's links. */
const FIELD: Record<string, string> = {
  childId: 'check-in-youth',
  date: 'check-in-date',
  kind: 'check-in-kind',
  engagement: 'check-in-engagement',
  topics: 'check-in-topics',
  actionItems: 'check-in-actions',
  privateNotes: 'check-in-private-notes',
  followUpOn: 'check-in-follow-up',
};

/** Today on this device, as yyyy-MM-dd. */
function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Logs a mentor check-in (dialog: mentor-check-in, L2-090 criteria 1 to 3): the youth (fixed when opened from her record), when and how they
 * met, how it went, what they talked about, action items, private notes, a follow-up, sharing and whether the guardian was informed. Checks
 * the required choices here and shows the server's errors by field; closes with the youth's name once saved.
 */
@Component({
  selector: 'ph-mentor-check-in-dialog',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCheckbox,
    PhDescriptionList,
    PhDialog,
    PhErrorSummary,
    PhRadioGroup,
    PhSelect,
    PhSwitch,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentor-check-in-dialog.html',
})
export class MentorCheckInDialog {
  private readonly api = inject(MENTORING_API);
  protected readonly data = inject<MentorCheckInDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);

  protected readonly kinds = KIND_OPTIONS;
  protected readonly engagements = ENGAGEMENT_OPTIONS;
  protected readonly youthOptions: SelectOption[] = [
    { value: '', label: 'Choose a youth' },
    ...this.data.youth.map((y) => ({ value: y.id, label: y.name })),
  ];
  protected readonly fixedFacts: Fact[] = this.data.fixed
    ? [{ key: 'youth', term: 'Youth', value: this.data.fixed.name }]
    : [];

  protected readonly childId = signal(this.data.fixed?.id ?? '');
  protected readonly date = signal(localToday());
  protected readonly kind = signal('');
  protected readonly engagement = signal('');
  protected readonly topics = signal('');
  protected readonly actionItems = signal('');
  protected readonly privateNotes = signal('');
  protected readonly followUpOn = signal('');
  protected readonly shared = signal(false);
  protected readonly guardianInformed = signal(false);

  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: FIELD[key] ?? key, message })),
  );

  protected count(value: string): string {
    return `${value.length.toLocaleString('en-US')} / 2,000`;
  }

  protected save(): void {
    if (this.busy()) return;
    const missing: Record<string, string> = {};
    if (!this.childId()) missing['childId'] = 'Choose a youth.';
    if (!this.date()) missing['date'] = 'Choose the date.';
    if (!this.kind()) missing['kind'] = 'Choose how you met.';
    if (!this.engagement()) missing['engagement'] = 'Choose how it went.';
    this.errors.set(missing);
    if (Object.keys(missing).length) return;
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .logCheckIn({
        childId: this.childId(),
        date: this.date(),
        kind: this.kind(),
        engagement: this.engagement(),
        topics: this.topics().trim() || null,
        actionItems: this.actionItems().trim() || null,
        privateNotes: this.privateNotes().trim() || null,
        followUpOn: this.followUpOn() || null,
        shared: this.shared(),
        guardianInformed: this.guardianInformed(),
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          const youth = this.data.fixed ?? this.data.youth.find((y) => y.id === this.childId());
          this.ref.close(youth?.name ?? '');
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }
}
