import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CURRICULUM_API, LoadResult, Curriculum } from '@promisehub/api';
import { PhButton, PhCard, PhEmptyState, PhPageHeader, PhSkeleton } from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

/** Curriculum, where admins and program directors author tracks (mock: curriculum). */
@Component({
  selector: 'ph-curriculum-page',
  imports: [PhButton, PhCard, PhEmptyState, PhPageHeader, PhSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './curriculum-page.html',
})
export class CurriculumPage {
  private readonly api = inject(CURRICULUM_API);
  private readonly refresh$ = new Subject<void>();

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.tracks().pipe(startWith<LoadResult<Curriculum> | null>(null))),
    ),
    { initialValue: null },
  );

  protected reload(): void {
    this.refresh$.next();
  }
}
