import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  HOUSEHOLDS_API,
  HouseholdList,
  HouseholdSummary,
  LoadResult,
  SESSION_API,
  can,
} from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhChip,
  PhDialogs,
  PhEmptyState,
  PhFlag,
  PhList,
  PhListItem,
  PhPageHeader,
  PhTextField,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, debounceTime, startWith, switchMap } from 'rxjs';
import { AddFamilyDialog } from '../add-family/add-family-dialog';

/** Families (mock: families): households with search, filter chips and Add family. */
@Component({
  selector: 'ph-families-page',
  imports: [
    FormsModule,
    PhBadge,
    PhButton,
    PhCard,
    PhChip,
    PhEmptyState,
    PhFlag,
    PhList,
    PhListItem,
    PhPageHeader,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './families-page.html',
  styleUrl: './families-page.scss',
})
export class FamiliesPage {
  private readonly api = inject(HOUSEHOLDS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly router = inject(Router);
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  private readonly query$ = new Subject<void>();

  protected q = '';
  protected readonly filter = signal('all');
  protected readonly canAdd = computed(
    () => !!this.session() && can(this.session()!.role, 'writeHouseholds'),
  );
  protected readonly result = toSignal<LoadResult<HouseholdList> | null>(
    this.query$.pipe(
      debounceTime(150),
      startWith(undefined),
      switchMap(() => this.api.list(this.q.trim(), this.filter())),
    ),
    { initialValue: null },
  );
  protected readonly chips = [
    { id: 'all', label: 'All', count: 'all' },
    { id: 'missing-info', label: 'Missing info', count: 'missingInfo' },
    { id: 'spanish', label: 'Spanish', count: 'spanish' },
    { id: 'french', label: 'French', count: 'french' },
  ] as const;

  protected reload(): void {
    this.query$.next();
  }

  protected setFilter(id: string): void {
    this.filter.set(id);
    this.reload();
  }

  protected meta(h: HouseholdSummary): string {
    return [h.primaryGuardian, h.children.join(', '), h.language === 'English' ? null : h.language]
      .filter(Boolean)
      .join(' · ');
  }

  protected subtitle(list: HouseholdList): string {
    const { all, children } = list.counts;
    return `${all} ${all === 1 ? 'household' : 'households'} · ${children} ${children === 1 ? 'child' : 'children'}`;
  }

  protected addFamily(): void {
    this.dialogs
      .open<string | undefined, void, AddFamilyDialog>(AddFamilyDialog)
      .closed.subscribe((id) => id && void this.router.navigate(['/families', id]));
  }
}
