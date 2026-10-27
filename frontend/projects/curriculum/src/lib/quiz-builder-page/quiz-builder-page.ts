import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CURRICULUM_API, FeedbackMode, LoadResult, QuizDetail } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhErrorSummary,
  PhList,
  PhListItem,
  PhPageHeader,
  PhRadioGroup,
  PhSelect,
  PhSkeleton,
  PhSwitch,
  PhTextField,
  RadioOption,
  SelectOption,
  ToastService,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { attachOptions } from '../attach-options';
import { CurriculumStatusDialog } from '../curriculum-status-dialog/curriculum-status-dialog';
import { CurriculumStatusDialogData } from '../curriculum-status-dialog/curriculum-status-dialog-data';
import { DeleteQuestionDialog } from '../delete-question-dialog/delete-question-dialog';
import { DeleteQuestionDialogData } from '../delete-question-dialog/delete-question-dialog-data';
import { questionMeta } from '../question-label';
import { QuizQuestionDialog } from '../quiz-question-dialog/quiz-question-dialog';
import { QuizQuestionDialogData } from '../quiz-question-dialog/quiz-question-dialog-data';
import { statusLabel, statusTone } from '../status-label';

const SUMMARY_FIELDS: Record<string, string> = {
  lessonId: 'attach',
  attemptsAllowed: 'attempts',
};

/** The quiz builder (mock: curriculum-quiz, L2-073): questions in order with their correct answers, the rules and the status. */
@Component({
  selector: 'ph-quiz-builder-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorSummary,
    PhList,
    PhListItem,
    PhPageHeader,
    PhRadioGroup,
    PhSelect,
    PhSkeleton,
    PhSwitch,
    PhTextField,
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
  protected form = {
    title: '',
    lessonId: '',
    passMark: '70',
    attempts: '2',
    feedback: 'ShowAnswers' as string,
    shuffle: false,
    requiredToComplete: false,
    requireApproval: false,
  };
  protected readonly feedbackOptions: RadioOption[] = [
    { value: 'ShowAnswers', label: 'Show correct answers after each attempt' },
    { value: 'ScoreOnly', label: 'Show the score only' },
    { value: 'AfterLastAttempt', label: 'Show correct answers after the last attempt' },
  ];
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([field, message]) => ({
      field: SUMMARY_FIELDS[field] ?? field,
      message,
    })),
  );
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly statusLabel = statusLabel;
  protected readonly statusTone = statusTone;
  protected readonly questionMeta = questionMeta;

  constructor() {
    effect(() => {
      const r = this.result();
      if (r?.status !== 'loaded') return;
      const q = r.value;
      this.form = {
        title: q.title,
        lessonId: q.lessonId ?? '',
        passMark: `${q.passMark}`,
        attempts: q.attemptsAllowed === null ? '' : `${q.attemptsAllowed}`,
        feedback: q.feedback,
        shuffle: q.shuffle,
        requiredToComplete: q.requiredToComplete,
        requireApproval: q.requireApproval,
      };
    });
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected attachOptions(q: QuizDetail): SelectOption[] {
    return attachOptions(q.lessons);
  }

  /** 50% to 100% in tens, plus the saved mark when it is another value. */
  protected passMarkOptions(q: QuizDetail): SelectOption[] {
    const marks = [...new Set([50, 60, 70, 80, 90, 100, q.passMark])].sort((a, b) => a - b);
    return marks.map((m) => ({ value: `${m}`, label: `${m}%` }));
  }

  /** Unlimited, 1, 2, 3, 5 or 10, plus the saved number when it is another value. */
  protected attemptOptions(q: QuizDetail): SelectOption[] {
    const counts = [
      ...new Set([1, 2, 3, 5, 10, ...(q.attemptsAllowed ? [q.attemptsAllowed] : [])]),
    ].sort((a, b) => a - b);
    return [
      { value: '', label: 'Unlimited' },
      ...counts.map((c) => ({ value: `${c}`, label: `${c}` })),
    ];
  }

  protected save(q: QuizDetail): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .updateQuiz(q.id, {
        title: this.form.title,
        lessonId: this.form.lessonId || null,
        passMark: Number(this.form.passMark),
        attemptsAllowed: this.form.attempts === '' ? null : Number(this.form.attempts),
        feedback: this.form.feedback as FeedbackMode,
        shuffle: this.form.shuffle,
        requiredToComplete: this.form.requiredToComplete,
        requireApproval: this.form.requireApproval,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.errors.set({});
          this.toasts.show({ tone: 'success', title: 'Quiz saved', text: this.form.title.trim() });
          this.reload();
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }

  protected changeStatus(q: QuizDetail): void {
    this.dialogs
      .open<boolean, CurriculumStatusDialogData, CurriculumStatusDialog>(CurriculumStatusDialog, {
        kind: 'quiz',
        id: q.id,
        name: q.title,
        status: q.status,
        audience: q.programs.length
          ? `${q.programs.join(' and ')}, once ${q.moduleTitle} and ${q.trackName} are published`
          : `No cohort follows ${q.trackName} yet`,
      })
      .closed.subscribe((saved) => saved && this.reload());
  }

  protected move(q: QuizDetail, index: number, by: -1 | 1): void {
    const ids = q.questions.map((x) => x.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + by, 0, moved!);
    this.api.reorderQuestions(q.id, ids).subscribe((outcome) => {
      if (outcome.status === 'saved') {
        this.reload();
      } else {
        this.toasts.show({ tone: 'danger', title: 'The order was not saved', text: 'Try again.' });
      }
    });
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
