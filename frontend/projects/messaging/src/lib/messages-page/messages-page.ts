import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  LoadResult,
  MESSAGING_API,
  MessageList,
  MessageRow,
  SESSION_API,
  can,
} from '@promisehub/api';
import {
  PhAlert,
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhErrorPage,
  PhList,
  PhListItem,
  PhPageHeader,
  formatDateTime,
} from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';
import { channelLabel } from '../channel-label';

/** Messages (mock: messages): sent messages, newest first, with delivery and this month's SMS use. */
@Component({
  selector: 'ph-messages-page',
  imports: [
    PhAlert,
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorPage,
    PhList,
    PhListItem,
    PhPageHeader,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './messages-page.html',
})
export class MessagesPage {
  private readonly api = inject(MESSAGING_API);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  protected readonly result = signal<LoadResult<MessageList> | null>(null);
  protected readonly canSend = computed(() => !!this.me() && can(this.me()!.role, 'sendMessages'));

  constructor() {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.list().subscribe((r) => this.result.set(r));
  }

  protected subtitle(list: MessageList): string {
    const sent = `${list.messages.length} sent`;
    return `${sent} · ${list.segmentsUsed.toLocaleString('en-CA')} of ${list.segmentCap.toLocaleString('en-CA')} SMS segments used this month`;
  }

  protected meta(m: MessageRow): string {
    return [
      formatDateTime(m.sentAt),
      `${m.recipientCount} guardians`,
      m.audience,
      channelLabel(m.channel),
    ].join(' · ');
  }

  protected badge(m: MessageRow): { label: string; tone: 'info' | 'success' | 'warning' } {
    if (m.status === 'Sending') return { label: 'Sending', tone: 'info' };
    if (m.failedCount) return { label: `${m.failedCount} failed`, tone: 'warning' };
    if (m.pausedCount) return { label: `${m.pausedCount} paused`, tone: 'warning' };
    return { label: 'Delivered', tone: 'success' };
  }
}
