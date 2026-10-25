import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Delivery, LoadResult, MESSAGING_API, MessageDetail } from '@promisehub/api';
import {
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhSmsPreview,
  PhStat,
  PhTable,
  TableCell,
  TableColumn,
  formatDateTime,
  formatTime,
} from '@promisehub/components';
import { channelLabel, deliveryChannel, guardians } from '../channel-label';

const STATUS: Record<
  Delivery['status'],
  { text: string; tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger' }
> = {
  Queued: { text: 'Queued', tone: 'neutral' },
  Sent: { text: 'Sent', tone: 'success' },
  FellBackToEmail: { text: 'Emailed instead', tone: 'info' },
  Paused: { text: 'Paused', tone: 'warning' },
  Failed: { text: 'Failed', tone: 'danger' },
};

/** One message (mock: message): the text as sent, delivery counts and each household's delivery, problems first. */
@Component({
  selector: 'ph-message-page',
  imports: [
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhSmsPreview,
    PhStat,
    PhTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './message-page.html',
})
export class MessagePage {
  private readonly api = inject(MESSAGING_API);

  readonly messageId = input.required<string>();

  protected readonly result = signal<LoadResult<MessageDetail> | null>(null);
  protected readonly columns: TableColumn[] = [
    { key: 'guardian', label: 'Guardian' },
    { key: 'household', label: 'Household' },
    { key: 'channel', label: 'Channel' },
    { key: 'status', label: 'Status' },
    { key: 'detail', label: 'Reason or time' },
  ];
  protected readonly rows = computed<Record<string, TableCell>[]>(() => {
    const r = this.result();
    if (r?.status !== 'loaded') return [];
    return r.value.deliveries.map((d) => ({
      guardian: d.guardian ?? '—',
      household: d.household,
      channel: deliveryChannel(d),
      status: STATUS[d.status],
      detail: d.reason ?? (d.at ? formatTime(new Date(d.at)) : ''),
    }));
  });

  constructor() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
    effect(() => this.load(this.messageId()));
    // While the job is still sending, look again every few seconds.
    effect(() => {
      const r = this.result();
      clearTimeout(timer);
      if (r?.status === 'loaded' && r.value.status === 'Sending') {
        timer = setTimeout(() => this.load(this.messageId(), false), 3000);
      }
    });
  }

  protected load(id: string, reset = true): void {
    if (reset) this.result.set(null);
    this.api.get(id).subscribe((r) => this.result.set(r));
  }

  protected subtitle(m: MessageDetail): string {
    return [
      `Sent by ${m.sentBy}`,
      formatDateTime(m.sentAt),
      guardians(m.recipientCount),
      channelLabel(m.channel),
    ].join(' · ');
  }

  protected languages(m: MessageDetail): string {
    return `To ${m.audience}. Households: ${m.languages.join(', ')}.`;
  }
}
