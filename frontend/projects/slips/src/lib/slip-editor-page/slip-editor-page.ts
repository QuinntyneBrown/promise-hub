import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LoadResult, SESSION_API, SLIPS_API, Slip, SlipFields, can } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhProgressBar,
  PhRadioGroup,
  PhSelect,
  PhStat,
  PhSwitch,
  PhTable,
  PhTextField,
  PhTextarea,
  RadioOption,
  SelectOption,
  TableCell,
  TableColumn,
  ToastService,
  formatDateTime,
  fromLocalInput,
} from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';
import { CancelSendDialog } from '../cancel-send-dialog/cancel-send-dialog';
import { SendNowDialog } from '../send-now-dialog/send-now-dialog';
import { SendReminderData, SendReminderDialog } from '../send-reminder-dialog/send-reminder-dialog';
import { formatSignBy } from '../sign-by';

const LABELS: Record<string, string> = {
  title: 'Slip title',
  body: 'Slip text',
  signBy: 'Sign by',
};
const ANSWER: Record<
  Slip['responses'][number]['status'],
  { text: string; tone: 'success' | 'danger' | 'neutral' }
> = {
  Signed: { text: 'Signed', tone: 'success' },
  Declined: { text: 'Declined', tone: 'danger' },
  Outstanding: { text: 'Outstanding', tone: 'neutral' },
};

/**
 * The slip editor (mock: slip-editor): write an event's slip and send it now, later or not yet; once sent, track who
 * signed and edit it, re-opening signing on a material change (L2-014).
 */
@Component({
  selector: 'ph-slip-editor-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhProgressBar,
    PhRadioGroup,
    PhSelect,
    PhStat,
    PhSwitch,
    PhTable,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slip-editor-page.html',
  styleUrl: './slip-editor-page.scss',
})
export class SlipEditorPage {
  private readonly api = inject(SLIPS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  /** Route parameter from /events/:eventId/slip. */
  readonly eventId = input.required<string>();

  protected readonly result = signal<LoadResult<Slip> | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected fields: SlipFields = {
    title: '',
    body: '',
    signBy: '',
    askPhotos: true,
    askSwimming: false,
    askLunch: true,
    reminders: 'TwiceWeekly',
    channel: 'TextAndEmail',
  };
  protected when = 'now';
  protected at = '';
  protected material = false;

  protected readonly canWrite = computed(() => !!this.me() && can(this.me()!.role, 'manageSlips'));
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([field, message]) => ({ field, message })),
  );
  protected readonly reminders: SelectOption[] = [
    { value: 'TwiceWeekly', label: 'Tue and Thu at 6 pm until signed' },
    { value: 'Daily', label: 'Daily at 6 pm until signed' },
    { value: 'Once', label: 'Once, 2 days before' },
    { value: 'None', label: 'None' },
  ];
  protected readonly channels: RadioOption[] = [
    {
      value: 'TextAndEmail',
      label: 'Text and email',
      hint: 'Email for households without a mobile',
    },
    { value: 'EmailOnly', label: 'Email only', hint: 'Free; slower' },
  ];
  protected readonly timings: RadioOption[] = [
    { value: 'now', label: 'Now' },
    { value: 'later', label: 'Later', hint: 'Pick a time' },
    { value: 'draft', label: 'Don’t send yet', hint: 'Save a draft' },
  ];
  protected readonly columns: TableColumn[] = [
    { key: 'child', label: 'Child' },
    { key: 'household', label: 'Household' },
    { key: 'status', label: 'Answer' },
    { key: 'by', label: 'By' },
  ];
  protected readonly rows = computed<Record<string, TableCell>[]>(() => {
    const r = this.result();
    if (r?.status !== 'loaded') return [];
    return r.value.responses.map((x) => ({
      child: x.child,
      household: x.household,
      status: ANSWER[x.status],
      by: x.signedBy ?? '',
    }));
  });

  constructor() {
    effect(() => this.load(this.eventId()));
  }

  protected load(eventId: string): void {
    this.api.forEvent(eventId).subscribe((r) => {
      if (r.status === 'loaded') {
        const s = r.value;
        this.fields = {
          title: s.title,
          body: s.body,
          signBy: s.signBy,
          askPhotos: s.askPhotos,
          askSwimming: s.askSwimming,
          askLunch: s.askLunch,
          reminders: s.reminders,
          channel: s.channel,
        };
        this.material = false;
      }
      this.result.set(r);
    });
  }

  protected subtitle(s: Slip): string {
    const parts = [s.eventName, `${s.households} households`];
    if (s.status === 'Sent')
      parts.push(`${s.signed} of ${s.children} signed`, `Version ${s.version}`);
    return parts.join(' · ');
  }

  protected count(): string {
    return `${this.fields.body.length} / 600`;
  }

  protected primaryLabel(): string {
    return this.when === 'later'
      ? 'Schedule'
      : this.when === 'draft'
        ? 'Save draft'
        : 'Save and send';
  }

  protected scheduledFor(s: Slip): string {
    return s.scheduledFor ? formatDateTime(s.scheduledFor) : '';
  }

  protected signedNotice(s: Slip): string {
    return `${s.signed} guardian${s.signed === 1 ? ' has' : 's have'} already signed this text`;
  }

  protected emailOnly(s: Slip): string | null {
    const names = s.delivery?.emailInstead ?? [];
    return names.length
      ? `${names.length} household${names.length === 1 ? '' : 's'} got email only: ${names.join(', ')}.`
      : null;
  }

  protected label(field: string): string {
    return LABELS[field] ?? field;
  }

  /** Saves the draft, then sends now, schedules, or stops there. */
  protected submit(s: Slip): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.saveDraft(s.eventId, this.fields).subscribe((saved) => {
      if (saved.status !== 'saved') return this.settle(saved);
      if (this.when === 'draft') {
        this.toasts.show({ tone: 'success', title: 'Draft saved', text: this.fields.title });
        return this.settle(saved, s);
      }
      const at = this.when === 'later' ? fromLocalInput(this.at) : null;
      this.api.send(s.id, at).subscribe((sent) => {
        if (sent.status === 'saved') {
          this.toasts.show(
            at
              ? { tone: 'success', title: 'Slip scheduled', text: `${s.households} households` }
              : { tone: 'success', title: 'Slip sent', text: `${s.households} households` },
          );
        }
        this.settle(sent, s);
      });
    });
  }

  protected saveChanges(s: Slip): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    const material = this.material;
    this.api
      .edit(s.id, {
        title: this.fields.title,
        body: this.fields.body,
        signBy: this.fields.signBy,
        material,
      })
      .subscribe((outcome) => {
        if (outcome.status === 'saved') {
          this.toasts.show({
            tone: 'success',
            title: 'Slip updated',
            text: material ? 'Everyone signs again' : 'Answers so far still stand',
          });
        }
        this.settle(outcome, s);
      });
  }

  protected sendNow(s: Slip): void {
    this.dialogs
      .open<boolean, { title: string; when: string; households: number }, SendNowDialog>(
        SendNowDialog,
        {
          title: s.title,
          when: this.scheduledFor(s),
          households: s.households,
        },
      )
      .closed.subscribe((yes) => {
        if (!yes) return;
        this.api.sendNow(s.id).subscribe((outcome) => {
          if (outcome.status === 'saved')
            this.toasts.show({
              tone: 'success',
              title: 'Slip sent',
              text: `${s.households} households`,
            });
          this.settle(outcome, s);
        });
      });
  }

  protected remind(s: Slip): void {
    this.api.unsigned(s.id).subscribe((r) => {
      if (r.status !== 'loaded') return this.failed.set(true);
      this.dialogs
        .open<number, SendReminderData, SendReminderDialog>(SendReminderDialog, {
          slipId: s.id,
          body: `Reminder: please sign {child}’s slip for “${s.title}” by ${formatSignBy(s.signBy)}: {link}`,
          families: r.value.households,
        })
        .closed.subscribe((sent) => {
          if (sent === undefined) return;
          this.toasts.show({
            tone: 'success',
            title: 'Reminder sent',
            text: `${sent} ${sent === 1 ? 'family' : 'families'}`,
          });
        });
    });
  }

  protected cancelSend(s: Slip): void {
    this.dialogs
      .open<boolean, { title: string }, CancelSendDialog>(CancelSendDialog, { title: s.title })
      .closed.subscribe((yes) => {
        if (!yes) return;
        this.api.cancelSend(s.id).subscribe((outcome) => {
          if (outcome.status === 'saved')
            this.toasts.show({
              tone: 'info',
              title: 'Scheduled send cancelled',
              text: 'The slip is a draft again.',
            });
          this.when = 'now';
          this.settle(outcome, s);
        });
      });
  }

  private settle(outcome: { status: string; errors?: Record<string, string> }, s?: Slip): void {
    this.busy.set(false);
    if (outcome.status === 'saved') {
      if (s) this.load(s.eventId);
    } else if (outcome.status === 'invalid') {
      this.errors.set(outcome.errors ?? {});
    } else {
      this.failed.set(true);
    }
  }
}
