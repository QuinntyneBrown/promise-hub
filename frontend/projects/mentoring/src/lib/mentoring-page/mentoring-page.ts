import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MENTORING_API, LoadResult, AssignedYouth } from '@promisehub/api';
import { PhButton, PhCard, PhEmptyState, PhPageHeader, PhSkeleton } from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

/** Mentoring, the mentor’s assigned youth (mock: mentoring). A mentor sees only youth assigned to them; there are none until assignments exist. */
@Component({
  selector: 'ph-mentoring-page',
  imports: [PhButton, PhCard, PhEmptyState, PhPageHeader, PhSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentoring-page.html',
})
export class MentoringPage {
  private readonly api = inject(MENTORING_API);
  private readonly refresh$ = new Subject<void>();

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.youth().pipe(startWith<LoadResult<AssignedYouth> | null>(null))),
    ),
    { initialValue: null },
  );

  protected reload(): void {
    this.refresh$.next();
  }
}
