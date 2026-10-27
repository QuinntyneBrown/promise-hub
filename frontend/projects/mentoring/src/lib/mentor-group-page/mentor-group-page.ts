import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { LoadResult, MENTORING_API, MentorCohort, MentorCohortMember } from '@promisehub/api';
import {
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

/** A cohort the mentor leads or supports (mock: mentor-group, L2-065): its mentors and its members, each linking to their record. */
@Component({
  selector: 'ph-mentor-group-page',
  imports: [
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentor-group-page.html',
})
export class MentorGroupPage {
  private readonly api = inject(MENTORING_API);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly programId = input.required<string>();

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<MentorCohort> | null>(
    toObservable(this.programId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.mentorCohort(id).pipe(startWith<LoadResult<MentorCohort> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected subtitle(c: MentorCohort): string {
    const role = c.role === 'Lead' ? 'You’re the lead mentor' : 'You’re a supporting mentor';
    return [c.term, c.schedule, role].filter(Boolean).join(' · ');
  }

  protected memberMeta(m: MentorCohortMember): string {
    return [m.age !== null ? `Age ${m.age}` : null, m.mentor ? `Mentor: ${m.mentor}` : 'No mentor']
      .filter(Boolean)
      .join(' · ');
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
