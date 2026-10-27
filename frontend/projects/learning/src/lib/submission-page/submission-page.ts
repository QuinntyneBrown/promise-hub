import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AssignmentSubmissionView,
  GatedResult,
  LEARNING_API,
  SubmissionHistoryItem,
} from '@promisehub/api';
import {
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhTimeline,
  TimelineEntry,
  formatDateTime,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { SUBMISSION_LABEL, SUBMISSION_TONE, fileSize } from '../assignment-words';

const STEP: Record<SubmissionHistoryItem['kind'], string> = {
  Submitted: 'submitted it',
  ReviewStarted: 'started reviewing',
  RevisionRequested: 'asked for a revision',
  Resubmitted: 'resubmitted it',
  Accepted: 'accepted it',
};

/**
 * A youth's own submission (mock: learn-submission, L2-078 criteria 1 to 3): its status, what she sent, the mentor's feedback and what
 * happened, read only.
 */
@Component({
  selector: 'ph-submission-page',
  imports: [
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhTimeline,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './submission-page.html',
  styleUrl: './submission-page.css',
})
export class SubmissionPage {
  private readonly api = inject(LEARNING_API);
  private readonly refresh$ = new Subject<void>();
  protected readonly label = SUBMISSION_LABEL;
  protected readonly tone = SUBMISSION_TONE;

  /** Route parameter. */
  readonly id = input.required<string>();

  /** Null while loading. */
  protected readonly result = toSignal<GatedResult<AssignmentSubmissionView> | null>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api
              .submission(id)
              .pipe(startWith<GatedResult<AssignmentSubmissionView> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected subtitle(s: AssignmentSubmissionView): string {
    const when = formatDateTime(s.submittedAt);
    return `${s.round > 1 ? 'Resubmitted' : 'Submitted'} ${when}${s.late ? ' · late' : ''}`;
  }

  protected entries(s: AssignmentSubmissionView): TimelineEntry[] {
    return s.history.map((h, i) => ({
      key: `${i}`,
      actor: h.actor,
      text:
        h.kind === 'Accepted' && s.points !== null
          ? `${STEP[h.kind]} · ${s.points} of ${s.totalPoints} points`
          : h.kind === 'Submitted' && s.late && i === 0
            ? 'submitted it late'
            : STEP[h.kind],
      meta: formatDateTime(h.at),
    }));
  }

  protected fileMeta(s: AssignmentSubmissionView): string {
    return s.file ? `${s.file.kind} · ${fileSize(s.file.bytes)}` : '';
  }

  protected fileUrl(s: AssignmentSubmissionView): string {
    return this.api.submissionFileUrl(s.id);
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
