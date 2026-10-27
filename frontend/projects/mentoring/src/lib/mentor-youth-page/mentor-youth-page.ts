import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AssignedYouth, LoadResult, MENTORING_API, MentoredYouth } from '@promisehub/api';
import {
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhTextField,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

/** My youth (mock: mentor-youth, L2-063 criterion 4): every youth in the mentor’s scope, filtered by name on the device. */
@Component({
  selector: 'ph-mentor-youth-page',
  imports: [
    FormsModule,
    PhBreadcrumb,
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
  templateUrl: './mentor-youth-page.html',
})
export class MentorYouthPage {
  private readonly api = inject(MENTORING_API);
  private readonly refresh$ = new Subject<void>();

  protected readonly query = signal('');

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.youth().pipe(startWith<LoadResult<AssignedYouth> | null>(null))),
    ),
    { initialValue: null },
  );

  protected readonly matches = computed(() => {
    const r = this.result();
    const q = this.query().trim().toLocaleLowerCase();
    if (r?.status !== 'loaded') return [];
    return q ? r.value.youth.filter((y) => y.name.toLocaleLowerCase().includes(q)) : r.value.youth;
  });

  protected meta(y: MentoredYouth): string {
    return [y.age !== null ? `Age ${y.age}` : null, y.programs.join(', ') || null]
      .filter(Boolean)
      .join(' · ');
  }

  protected subtitle(count: number): string {
    return `${count} youth assigned to you, directly or through a cohort you’re on.`;
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
