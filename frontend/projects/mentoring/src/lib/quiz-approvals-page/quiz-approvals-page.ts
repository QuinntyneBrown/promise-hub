import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoadResult, MENTORING_API, QuizApprovalItem, QuizApprovals } from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhPageHeader,
  PhSkeleton,
  PhTable,
  TableCell,
  TableColumn,
  ToastService,
  formatDateTime,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { ApproveAllQuizzesDialog } from '../approve-all-quizzes-dialog/approve-all-quizzes-dialog';
import { ApproveQuizDialog } from '../approve-quiz-dialog/approve-quiz-dialog';

/**
 * Quiz approvals (mock: mentor-quiz-approvals, L2-081): the quiz results of the mentor's youth that count only once approved, each with its
 * auto-score against the pass mark in words; Approve opens approve-quiz and Approve all opens approve-all-quizzes.
 */
@Component({
  selector: 'ph-quiz-approvals-page',
  imports: [
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhSkeleton,
    PhTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quiz-approvals-page.html',
})
export class QuizApprovalsPage {
  private readonly api = inject(MENTORING_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  protected readonly columns: TableColumn[] = [
    { key: 'youth', label: 'Youth' },
    { key: 'quiz', label: 'Quiz' },
    { key: 'module', label: 'Module' },
    { key: 'score', label: 'Auto-score' },
    { key: 'submitted', label: 'Submitted' },
  ];

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() =>
        this.api.quizApprovals().pipe(startWith<LoadResult<QuizApprovals> | null>(null)),
      ),
    ),
    { initialValue: null },
  );

  protected rows(items: QuizApprovalItem[]): Record<string, TableCell>[] {
    return items.map((i) => ({
      youth: i.youthName,
      quiz: i.quizTitle,
      module: i.moduleTitle,
      score:
        i.score >= i.passMark
          ? { text: `${i.score}% · Pass`, tone: 'success' }
          : { text: `${i.score}% · Below pass mark`, tone: 'warning' },
      submitted: formatDateTime(i.submittedAt),
    }));
  }

  protected approve(item: QuizApprovalItem): void {
    this.dialogs
      .open<boolean, QuizApprovalItem, ApproveQuizDialog>(ApproveQuizDialog, item)
      .closed.subscribe((done) => {
        if (!done) return;
        this.toasts.show({
          tone: 'success',
          title: 'Approved',
          text: `${item.quizTitle} · ${item.youthName}`,
        });
        this.refresh$.next();
      });
  }

  protected approveAll(items: QuizApprovalItem[]): void {
    this.dialogs
      .open<number, QuizApprovalItem[], ApproveAllQuizzesDialog>(ApproveAllQuizzesDialog, items)
      .closed.subscribe((approved) => {
        if (approved === undefined) return;
        this.toasts.show({
          tone: 'success',
          title: 'Approved',
          text: `${approved} quiz ${approved === 1 ? 'score' : 'scores'} at their auto-scores`,
        });
        this.refresh$.next();
      });
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
