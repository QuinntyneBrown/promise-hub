import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CONVERSATIONS_API,
  Conversation,
  DirectMessage,
  LoadResult,
  SESSION_API,
} from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhMessageThread,
  PhPageHeader,
  PhSkeleton,
  ThreadMessage,
} from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';
import { dayLabel, firstName, timeLabel } from '../thread-words';

/** A message the reader wrote that the server has not taken yet. */
interface Pending {
  id: string;
  body: string;
  state: 'sending' | 'failed';
}

/**
 * One conversation (mock: conversation, L2-106 criteria 2 to 4, L2-108): the messages oldest first in a message thread with the composer;
 * Sending… and Not sent with Try again; the blocked alert while a guardian's consent is needed; read only for a supervisor.
 */
@Component({
  selector: 'ph-conversation-page',
  imports: [
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhMessageThread,
    PhPageHeader,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './conversation-page.html',
})
export class ConversationPage {
  private readonly api = inject(CONVERSATIONS_API);
  private readonly youthId = inject(ActivatedRoute).snapshot.paramMap.get('youthId') ?? '';
  private next = 1;
  protected readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  /** Null while loading. */
  protected readonly result = signal<LoadResult<Conversation> | null>(null);
  protected readonly pending = signal<Pending[]>([]);
  protected readonly draft = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly blockedNow = signal(false);

  protected readonly conversation = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });
  /** Who the reader is talking with: the mentor for the youth, the youth for her mentor, both for a supervisor. */
  protected readonly other = computed(() => {
    const c = this.conversation();
    if (!c) return '';
    if (c.readOnly) return `${c.youthName} and ${c.mentorName ?? 'former mentors'}`;
    return this.me()?.role === 'Youth' ? (c.mentorName ?? '') : c.youthName;
  });
  protected readonly blocked = computed(() => !!this.conversation()?.blocked || this.blockedNow());
  protected readonly sending = computed(() => this.pending().some((p) => p.state === 'sending'));

  protected readonly messages = computed<ThreadMessage[]>(() => {
    const c = this.conversation();
    if (!c) return [];
    let lastDay = '';
    const items: ThreadMessage[] = c.messages.map((m) => {
      const day = dayLabel(m.sentAt);
      const item: ThreadMessage = {
        id: m.id,
        body: m.body,
        mine: m.mine,
        meta: `${m.mine ? 'You' : firstName(m.from)} · ${timeLabel(m.sentAt)}`,
        day: day !== lastDay ? day : null,
      };
      lastDay = day;
      return item;
    });
    return [
      ...items,
      ...this.pending().map((p): ThreadMessage => ({
        id: p.id,
        body: p.body,
        mine: true,
        meta: 'You · Sending…',
        state: p.state,
        day: lastDay === 'Today' ? null : 'Today',
      })),
    ];
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.get(this.youthId).subscribe((r) => this.result.set(r));
  }

  protected send(body: string): void {
    this.error.set(null);
    if (body.length > 2000) {
      this.error.set('Keep it to 2,000 characters.');
      return;
    }
    const pending: Pending = { id: `pending-${this.next++}`, body, state: 'sending' };
    this.pending.update((list) => [...list, pending]);
    this.draft.set('');
    this.deliver(pending);
  }

  protected retry(id: string): void {
    const failed = this.pending().find((p) => p.id === id);
    if (!failed) return;
    this.pending.update((list) =>
      list.map((p) => (p.id === id ? { ...p, state: 'sending' as const } : p)),
    );
    this.deliver(failed);
  }

  private deliver(pending: Pending): void {
    this.api.send(this.youthId, pending.body).subscribe((outcome) => {
      if (outcome.status === 'sent') {
        this.pending.update((list) => list.filter((p) => p.id !== pending.id));
        this.append(outcome.message);
      } else if (outcome.status === 'invalid') {
        this.pending.update((list) => list.filter((p) => p.id !== pending.id));
        this.draft.set(pending.body);
        this.error.set(outcome.errors['body'] ?? 'Check the message.');
      } else if (outcome.status === 'blocked') {
        this.pending.update((list) => list.filter((p) => p.id !== pending.id));
        this.draft.set(pending.body);
        this.blockedNow.set(true);
      } else {
        this.pending.update((list) =>
          list.map((p) => (p.id === pending.id ? { ...p, state: 'failed' as const } : p)),
        );
      }
    });
  }

  private append(message: DirectMessage): void {
    const r = this.result();
    if (r?.status !== 'loaded') return;
    if (r.value.messages.some((m) => m.id === message.id)) return;
    this.result.set({
      status: 'loaded',
      value: { ...r.value, messages: [...r.value.messages, message] },
    });
  }
}
