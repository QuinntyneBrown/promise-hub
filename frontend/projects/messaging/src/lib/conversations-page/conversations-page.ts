import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CONVERSATIONS_API,
  ConversationList,
  ConversationRow,
  LoadResult,
  REALTIME_EVENTS,
  SESSION_API,
  can,
} from '@promisehub/api';
import {
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, filter, map, merge, startWith, switchMap } from 'rxjs';
import { dayLabel, timeLabel } from '../thread-words';

/**
 * Messages between a mentor and a youth (mock: conversations, L2-106 criterion 1, L2-108 criterion 4): a mentor's conversations, a youth's
 * conversation with her mentor, or every conversation for a supervisor, each linking to the conversation.
 */
@Component({
  selector: 'ph-conversations-page',
  imports: [
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './conversations-page.html',
})
export class ConversationsPage {
  private readonly api = inject(CONVERSATIONS_API);
  private readonly refresh$ = new Subject<void>();
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  /** A message in any of the reader's conversations, or a (re)connected stream, fetches the list again quietly (L2-107). */
  private readonly quiet$ = inject(REALTIME_EVENTS)
    .events()
    .pipe(filter((e) => e.type === 'conversation' || e.type === 'open'));

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<ConversationList> | null>(
    merge(
      this.refresh$.pipe(
        startWith(undefined),
        map(() => true),
      ),
      this.quiet$.pipe(map(() => false)),
    ).pipe(
      switchMap((loud) =>
        loud
          ? this.api.list().pipe(startWith<LoadResult<ConversationList> | null>(null))
          : this.api.list().pipe(filter((r) => r.status === 'loaded')),
      ),
    ),
    { initialValue: null },
  );

  protected readonly supervisor = computed(
    () => !!this.me() && can(this.me()!.role, 'superviseConversations'),
  );
  protected readonly youth = computed(() => this.me()?.role === 'Youth');
  protected readonly subtitle = computed(() =>
    this.supervisor()
      ? 'Every conversation between a mentor and a youth, kept for safeguarding. You can read them; only the mentor and the youth write.'
      : this.youth()
        ? 'Talk with your mentor. Program directors can read these conversations.'
        : 'Talk with the youth you mentor. Program directors can read these conversations.',
  );

  protected title(c: ConversationRow): string {
    return this.youth() ? (c.mentorName ?? '') : c.youthName;
  }

  protected meta(c: ConversationRow): string {
    if (this.supervisor()) {
      const last = c.lastMessage ? ` · ${c.lastMessage}` : '';
      return `With ${c.mentorName ?? 'a former mentor'}${last}`;
    }
    if (c.blocked && !c.lastMessage) return 'Messaging opens once a guardian gives consent.';
    if (!c.lastMessage) return 'No messages yet';
    return c.lastMessageMine ? `You: ${c.lastMessage}` : c.lastMessage;
  }

  protected when(c: ConversationRow): string {
    if (!c.lastMessageAt) return '';
    const day = dayLabel(c.lastMessageAt);
    return day === 'Today' ? timeLabel(c.lastMessageAt) : day;
  }

  protected load(): void {
    this.refresh$.next();
  }
}
