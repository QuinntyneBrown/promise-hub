import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AssignmentBrief,
  DRAFT_STORE,
  GatedResult,
  LEARNING_API,
  SESSION_API,
} from '@promisehub/api';
import {
  PhAlert,
  PhAvatar,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhSkeleton,
  PhStat,
  PhTable,
  TableColumn,
  formatDateTime,
  formatDay,
} from '@promisehub/components';
import { Subject, combineLatest, map, startWith, switchMap } from 'rxjs';
import {
  SUBMISSION_LABEL,
  SUBMISSION_TONE,
  dueCaption,
  typesLong,
  typesShort,
} from '../assignment-words';

/** An assignment's brief and where the youth stands with it (mock: learn-assignment, L2-077 criteria 1, 2 and 5). */
@Component({
  selector: 'ph-assignment-page',
  imports: [
    PhAlert,
    PhAvatar,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhSkeleton,
    PhStat,
    PhTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './assignment-page.html',
  styleUrl: './assignment-page.css',
})
export class AssignmentPage {
  private readonly api = inject(LEARNING_API);
  private readonly refresh$ = new Subject<void>();
  private readonly drafts = inject(DRAFT_STORE);
  private readonly session = inject(SESSION_API);
  protected readonly typesShort = typesShort;
  protected readonly typesLong = typesLong;
  protected readonly dueCaption = dueCaption;
  protected readonly columns: TableColumn[] = [
    { key: 'criterion', label: 'Criterion' },
    { key: 'points', label: 'Points' },
  ];

  /** Route parameter. */
  readonly id = input.required<string>();

  /** When a draft kept on this device was saved, or null (L2-079 criterion 2). */
  protected draftSavedAt: string | null = null;

  /** Null while loading. */
  protected readonly result = toSignal<GatedResult<AssignmentBrief> | null>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            combineLatest([this.api.assignment(id), this.session.current()]).pipe(
              map(([r, me]) => {
                const draft = r.status === 'loaded' ? this.drafts.load(me.membershipId, id) : null;
                this.draftSavedAt = draft ? formatDateTime(draft.savedAt) : null;
                return r;
              }),
              startWith<GatedResult<AssignmentBrief> | null>(null),
            ),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected subtitle(a: AssignmentBrief): string {
    return [a.moduleTitle, 'Assignment', a.lessonTitle ? `after ${a.lessonTitle}` : null]
      .filter(Boolean)
      .join(' · ');
  }

  protected statusLabel(a: AssignmentBrief): string {
    if (a.submission) return SUBMISSION_LABEL[a.submission.status];
    return a.dueState === 'closed' ? 'Closed' : 'Not started';
  }

  protected statusTone(a: AssignmentBrief): 'neutral' | 'info' | 'warning' | 'success' {
    return a.submission ? SUBMISSION_TONE[a.submission.status] : 'neutral';
  }

  protected due(a: AssignmentBrief): string {
    return a.dueDate ? formatDay(a.dueDate) : 'No due date';
  }

  protected rows(a: AssignmentBrief): Record<string, string>[] {
    return a.rubric.map((r) => ({ criterion: r.description, points: `${r.points} points` }));
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
