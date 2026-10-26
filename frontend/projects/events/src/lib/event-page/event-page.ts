import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EVENTS_API, EventDetail, LoadResult, SESSION_API, can } from '@promisehub/api';
import {
  Fact,
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhPageHeader,
  formatDate,
  formatWhen,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, startWith, switchMap } from 'rxjs';
import { CancelEventDialog } from '../cancel-event-dialog/cancel-event-dialog';
import { EventAction, EventActionsDialog } from '../event-actions-dialog/event-actions-dialog';
import { slipBadge } from '../slip-label';

/** An event (mock: event): details, the slip's state and, when cancelled, who cancelled it. */
@Component({
  selector: 'ph-event-page',
  imports: [
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhPageHeader,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './event-page.html',
})
export class EventPage {
  private readonly api = inject(EVENTS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly eventId = input.required<string>();

  protected readonly canEdit = computed(
    () => !!this.session() && can(this.session()!.role, 'manageEvents'),
  );
  protected readonly canCancel = computed(
    () => !!this.session() && can(this.session()!.role, 'cancelEvents'),
  );
  protected readonly result = toSignal<LoadResult<EventDetail> | null>(
    toObservable(this.eventId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() => this.api.get(id)),
        ),
      ),
    ),
    { initialValue: null },
  );
  protected readonly badge = slipBadge;

  protected reload(): void {
    this.refresh$.next();
  }

  protected facts(e: EventDetail): Fact[] {
    return [
      { key: 'when', term: 'When', value: formatWhen(e.startsAt, e.endsAt) },
      { key: 'program', term: 'Program', value: e.programName },
      { key: 'where', term: 'Where', value: e.place ?? 'Not given' },
      { key: 'roster', term: 'Roster', value: `${e.rosterSize} children` },
      {
        key: 'no-show',
        term: 'No-show texts',
        value: e.noShowAlert ? 'On, 15 minutes after start' : 'Off',
      },
      ...(e.staffNotes ? [{ key: 'notes', term: 'Notes for staff', value: e.staffNotes }] : []),
    ];
  }

  protected cancelledText(e: EventDetail): string {
    const who = e.cancelledBy ? `Cancelled by ${e.cancelledBy}` : 'Cancelled';
    const when = e.cancelledAt ? ` on ${formatDate(e.cancelledAt)}` : '';
    return `${who}${when}.${e.cancellationMessage ? ' “' + e.cancellationMessage + '”' : ''}`;
  }

  protected actions(e: EventDetail): void {
    this.dialogs
      .open<EventAction, EventDetail, EventActionsDialog>(EventActionsDialog, e)
      .closed.subscribe((action) => {
        if (action !== 'cancel') return;
        this.dialogs
          .open<boolean, EventDetail, CancelEventDialog>(CancelEventDialog, e)
          .closed.subscribe((cancelled) => cancelled && this.reload());
      });
  }
}
