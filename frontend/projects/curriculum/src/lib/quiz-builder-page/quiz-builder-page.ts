import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CURRICULUM_API, LoadResult, QuizDetail } from '@promisehub/api';
import {
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  ToastService,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { DeleteQuestionDialog } from '../delete-question-dialog/delete-question-dialog';
import { DeleteQuestionDialogData } from '../delete-question-dialog/delete-question-dialog-data';
import { questionMeta } from '../question-label';
import { QuizQuestionDialog } from '../quiz-question-dialog/quiz-question-dialog';
import { QuizQuestionDialogData } from '../quiz-question-dialog/quiz-question-dialog-data';
import { statusLabel, statusTone } from '../status-label';

/** The quiz builder (mock: curriculum-quiz, L2-073): questions in order with their correct answers, the rules and the status. */
@Component({
  selector: 'ph-quiz-builder-page',
  imports: [
    PhBadge,
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
  templateUrl: './quiz-builder-page.html',
})
export class QuizBuilderPage {
  private readonly api = inject(CURRICULUM_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly quizId = input.required<string>();

  protected readonly result = toSignal<LoadResult<QuizDetail> | null>(
    toObservable(this.quizId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() => this.api.quiz(id).pipe(startWith<LoadResult<QuizDetail> | null>(null))),
        ),
      ),
    ),
    { initialValue: null },
  );
  protected readonly statusLabel = statusLabel;
  protected readonly statusTone = statusTone;
  protected readonly questionMeta = questionMeta;

  protected reload(): void {
    this.refresh$.next();
  }

  protected addQuestion(q: QuizDetail): void {
    this.dialogs
      .open<boolean, QuizQuestionDialogData, QuizQuestionDialog>(QuizQuestionDialog, {
        quizId: q.id,
      })
      .closed.subscribe((saved) => saved && this.reload());
  }

  protected editQuestion(q: QuizDetail, index: number): void {
    this.dialogs
      .open<boolean, QuizQuestionDialogData, QuizQuestionDialog>(QuizQuestionDialog, {
        quizId: q.id,
        question: q.questions[index],
        number: index + 1,
      })
      .closed.subscribe((saved) => saved && this.reload());
  }

  protected deleteQuestion(q: QuizDetail, index: number): void {
    const question = q.questions[index]!;
    this.dialogs
      .open<boolean, DeleteQuestionDialogData, DeleteQuestionDialog>(DeleteQuestionDialog, {
        id: question.id,
        number: index + 1,
        text: question.text,
      })
      .closed.subscribe((deleted) => {
        if (!deleted) return;
        this.toasts.show({ tone: 'success', title: 'Question deleted', text: question.text });
        this.reload();
      });
  }
}
