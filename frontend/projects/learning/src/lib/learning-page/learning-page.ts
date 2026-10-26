import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LEARNING_API, LoadResult, Learner } from '@promisehub/api';
import { PhButton, PhCard, PhEmptyState, PhPageHeader, PhSkeleton } from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

/** Learning, the youth’s lessons (mock: learning). Until a track is published it explains what will appear; the server returns only the youth’s own record. */
@Component({
  selector: 'ph-learning-page',
  imports: [PhButton, PhCard, PhEmptyState, PhPageHeader, PhSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-page.html',
})
export class LearningPage {
  private readonly api = inject(LEARNING_API);
  private readonly refresh$ = new Subject<void>();

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.learner().pipe(startWith<LoadResult<Learner> | null>(null))),
    ),
    { initialValue: null },
  );

  protected reload(): void {
    this.refresh$.next();
  }
}
