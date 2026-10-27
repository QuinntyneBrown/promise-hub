import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadResult, MENTORING_API, ReviewItem, ReviewQueue } from '@promisehub/api';
import {
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhSkeleton,
  PhTable,
  PhTabs,
  TabItem,
  TableCell,
  TableColumn,
  formatDateTime,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

type Filter = 'all' | 'assignments' | 'quizzes';

/**
 * Reviews, the mentor's review queue (mock: mentor-reviews, L2-080 criterion 1, L2-081 criterion 1): the submissions and quiz results of
 * the mentor's youth waiting for them, oldest first, filtered on the page. Matched only while Mentoring and Learning are on.
 */
@Component({
  selector: 'ph-reviews-page',
  imports: [
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhSkeleton,
    PhTable,
    PhTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reviews-page.html',
})
export class ReviewsPage {
  private readonly api = inject(MENTORING_API);
  private readonly refresh$ = new Subject<void>();

  protected readonly filter = signal<Filter>('all');
  protected readonly columns: TableColumn[] = [
    { key: 'youth', label: 'Youth' },
    { key: 'work', label: 'Work' },
    { key: 'type', label: 'Type' },
    { key: 'submitted', label: 'Submitted' },
  ];

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.reviews().pipe(startWith<LoadResult<ReviewQueue> | null>(null))),
    ),
    { initialValue: null },
  );

  protected readonly items = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.items : [];
  });

  protected readonly tabs = computed<TabItem[]>(() => {
    const all = this.items();
    return [
      { value: 'all', label: 'All', count: all.length },
      {
        value: 'assignments',
        label: 'Assignments',
        count: all.filter((i) => i.kind === 'Assignment').length,
      },
      { value: 'quizzes', label: 'Quizzes', count: all.filter((i) => i.kind === 'Quiz').length },
    ];
  });

  protected readonly shown = computed(() => {
    const f = this.filter();
    return this.items().filter(
      (i) => f === 'all' || (f === 'assignments' ? i.kind === 'Assignment' : i.kind === 'Quiz'),
    );
  });

  protected rows(items: ReviewItem[]): Record<string, TableCell>[] {
    return items.map((i) => ({
      youth: i.youthName,
      work: i.title,
      type: i.kind === 'Quiz' ? `Quiz · ${i.score}%` : 'Assignment',
      submitted: i.late
        ? { text: `${formatDateTime(i.submittedAt)} · Late`, tone: 'warning' }
        : formatDateTime(i.submittedAt),
    }));
  }

  protected link(i: ReviewItem): string[] {
    return i.kind === 'Quiz'
      ? ['/mentoring/reviews/quizzes']
      : ['/mentoring/reviews/submissions', i.id];
  }

  protected select(value: string): void {
    this.filter.set(value as Filter);
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
