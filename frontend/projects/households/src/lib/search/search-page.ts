import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SEARCH_API, SESSION_API, SearchResults, can } from '@promisehub/api';
import {
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhTextField,
  formatDateTime,
} from '@promisehub/components';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  map,
  merge,
  of,
  startWith,
  switchMap,
} from 'rxjs';

/** Search (mock: search): children, families and events of the organization, grouped by type. */
@Component({
  selector: 'ph-search-page',
  imports: [
    FormsModule,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-page.html',
  styleUrl: './search-page.css',
})
export class SearchPage {
  private readonly api = inject(SEARCH_API);
  private readonly router = inject(Router);
  private readonly retry$ = new Subject<void>();
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  /** The query parameter, as the top bar search sends it. */
  readonly q = input<string>('');
  protected readonly text = signal('');
  protected readonly date = formatDateTime;

  /** Null while searching; 'idle' before anything is typed. */
  protected readonly result = toSignal(
    merge(
      toObservable(this.q).pipe(map((q) => q ?? '')),
      this.retry$.pipe(map(() => this.text())),
    ).pipe(
      switchMap((q) => {
        this.text.set(q);
        return q.trim() ? this.api.search(q.trim()).pipe(startWith(null)) : of<'idle'>('idle');
      }),
    ),
    { initialValue: 'idle' as const },
  );

  protected readonly loaded = computed(() => {
    const r = this.result();
    return r && r !== 'idle' && r.status === 'loaded' ? r.value : null;
  });

  private readonly typed$ = new Subject<string>();

  constructor() {
    this.typed$
      .pipe(debounceTime(250))
      .subscribe(
        (q) => void this.router.navigate([], { queryParams: { q: q || null }, replaceUrl: true }),
      );
  }

  protected typed(q: string): void {
    this.text.set(q);
    this.typed$.next(q);
  }

  protected retry(): void {
    this.retry$.next();
  }

  protected canAddFamily(): boolean {
    return !!this.session() && can(this.session()!.role, 'writeHouseholds');
  }

  protected total(r: SearchResults): number {
    return r.children.length + r.households.length + (r.events?.length ?? 0);
  }
}
