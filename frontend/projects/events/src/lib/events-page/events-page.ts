import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  EVENTS_API,
  EventList,
  EventSummary,
  LoadResult,
  PROGRAMS_API,
  SESSION_API,
  can,
} from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhChip,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSelect,
  PhTextField,
  SelectOption,
  formatWhen,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, debounceTime, map, startWith, switchMap } from 'rxjs';
import { slipBadge } from '../slip-label';

/** Events (mock: events): upcoming, needing slips or past, by program and search. */
@Component({
  selector: 'ph-events-page',
  imports: [
    FormsModule,
    PhBadge,
    PhButton,
    PhCard,
    PhChip,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSelect,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './events-page.html',
  styleUrl: './events-page.scss',
})
export class EventsPage {
  private readonly api = inject(EVENTS_API);
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  private readonly query$ = new Subject<void>();

  protected q = '';
  protected programId = '';
  protected readonly filter = signal<'upcoming' | 'needs-slips' | 'past'>('upcoming');
  protected readonly canCreate = computed(
    () => !!this.session() && can(this.session()!.role, 'manageEvents'),
  );
  protected readonly programOptions = toSignal(
    inject(PROGRAMS_API)
      .list('active')
      .pipe(
        map((r): SelectOption[] => [
          { value: '', label: 'All programs' },
          ...(r.status === 'loaded'
            ? r.value.programs.map((p) => ({ value: p.id, label: p.name }))
            : []),
        ]),
      ),
    { initialValue: [{ value: '', label: 'All programs' }] as SelectOption[] },
  );
  protected readonly result = toSignal<LoadResult<EventList> | null>(
    this.query$.pipe(
      debounceTime(150),
      startWith(undefined),
      switchMap(() => this.api.list(this.filter(), this.programId, this.q.trim())),
    ),
    { initialValue: null },
  );
  protected readonly badge = slipBadge;

  protected reload(): void {
    this.query$.next();
  }

  protected setFilter(filter: 'upcoming' | 'needs-slips' | 'past'): void {
    this.filter.set(filter);
    this.reload();
  }

  protected meta(e: EventSummary): string {
    return [formatWhen(e.startsAt, e.endsAt), e.programName, `${e.rosterSize} on roster`].join(
      ' · ',
    );
  }

  protected subtitle(list: EventList): string {
    return `${list.upcoming} upcoming · ${list.needSlips} ${list.needSlips === 1 ? 'needs a slip' : 'need slips'}`;
  }
}
