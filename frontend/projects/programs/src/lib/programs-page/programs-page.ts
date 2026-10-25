import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  LoadResult,
  PROGRAMS_API,
  ProgramList,
  ProgramSummary,
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
} from '@promisehub/components';
import { EMPTY, Subject, catchError, merge, switchMap } from 'rxjs';

/** Programs (mock: programs): active or archived programs with enrolled against capacity. */
@Component({
  selector: 'ph-programs-page',
  imports: [PhBadge, PhButton, PhCard, PhChip, PhEmptyState, PhList, PhListItem, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './programs-page.html',
})
export class ProgramsPage {
  private readonly api = inject(PROGRAMS_API);
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  private readonly retry$ = new Subject<void>();

  protected readonly status = signal<'active' | 'archived'>('active');
  protected readonly canManage = computed(
    () => !!this.session() && can(this.session()!.role, 'managePrograms'),
  );
  protected readonly result = toSignal<LoadResult<ProgramList> | null>(
    merge(toObservable(this.status), this.retry$).pipe(
      switchMap(() => this.api.list(this.status())),
    ),
    { initialValue: null },
  );

  protected retry(): void {
    this.retry$.next();
  }

  protected meta(p: ProgramSummary): string {
    return [p.schedule, `${p.enrolled} of ${p.capacity} enrolled`].filter(Boolean).join(' · ');
  }

  protected subtitle(list: ProgramList): string {
    return `${list.active} active · ${list.enrolled} enrolled`;
  }
}
