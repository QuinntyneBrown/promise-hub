import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { GatedResult, LEARNING_API, QuizIntro } from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhStat,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { attemptsWord } from '../quiz-words';

/** A quiz's rules and where the youth stands with it (mock: learn-quiz-intro, L2-075 criteria 1, 2 and 7). */
@Component({
  selector: 'ph-quiz-intro-page',
  imports: [
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhStat,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quiz-intro-page.html',
  styleUrl: './quiz-intro-page.css',
})
export class QuizIntroPage {
  private readonly api = inject(LEARNING_API);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly id = input.required<string>();

  /** Null while loading. */
  protected readonly result = toSignal<GatedResult<QuizIntro> | null>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() => this.api.quiz(id).pipe(startWith<GatedResult<QuizIntro> | null>(null))),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected subtitle(q: QuizIntro): string {
    const where = q.lessonTitle ? `${q.moduleTitle} · after ${q.lessonTitle}` : q.moduleTitle;
    return `${where} · Quiz · ${q.questionCount} question${q.questionCount === 1 ? '' : 's'}`;
  }

  /** How many questions right reach the pass mark. */
  protected needed(q: QuizIntro): number {
    return Math.ceil((q.passMark * q.questionCount) / 100);
  }

  protected attemptValue(q: QuizIntro): string {
    if (!q.canStart) return '—';
    return q.attemptsAllowed === null
      ? `${q.attemptNumber}`
      : `${q.attemptNumber} of ${q.attemptsAllowed}`;
  }

  protected attemptCaption(q: QuizIntro): string {
    return !q.canStart ? 'None left' : q.inProgress ? 'In progress' : 'Not started yet';
  }

  protected rules(q: QuizIntro): string[] {
    const last =
      q.feedback === 'ShowAnswers'
        ? 'You’ll see your score and the correct answers when you submit.'
        : q.feedback === 'ScoreOnly'
          ? 'You’ll see your score when you submit.'
          : 'You’ll see your score when you submit, and the correct answers after your last attempt.';
    return [
      'Answer one question at a time. Use Back and Next to move around.',
      'Your answers save as you go, so you can stop and come back.',
      'Once you submit, you can’t change your answers for that attempt.',
      last,
    ];
  }

  /** The last attempt she can take, while she has not passed. */
  protected lastAttempt(q: QuizIntro): boolean {
    return (
      q.canStart &&
      !q.inProgress &&
      !q.passed &&
      q.attemptsUsed > 0 &&
      q.attemptsAllowed !== null &&
      q.attemptNumber === q.attemptsAllowed
    );
  }

  protected usedAll(q: QuizIntro): string {
    return attemptsWord(q.attemptsAllowed ?? 0);
  }

  protected take(q: QuizIntro): string {
    return `/learning/quizzes/${q.id}/take`;
  }

  protected attempt(id: string | null): string {
    return `/learning/attempts/${id}`;
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
