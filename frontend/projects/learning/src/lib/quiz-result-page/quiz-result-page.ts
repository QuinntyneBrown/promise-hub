import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { GatedResult, LEARNING_API, QuizResult, ReviewQuestion } from '@promisehub/api';
import {
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhQuizOption,
  PhSkeleton,
  PhStat,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { attemptsWord } from '../quiz-words';

const KEYS = 'ABCDEF';

/** One reviewed option: its letter, text, mark and the words that say what the mark means. */
interface ReviewRow {
  key: string;
  label: string;
  mark: 'correct' | 'wrong' | 'missed';
  note: string;
}

/**
 * A submitted attempt (mock: learn-quiz-result, L2-076): the score and pass against the pass mark, attempts left, and a review of
 * every question marked in words as the quiz's feedback rule allows; an attempt waiting for approval shows none of it.
 */
@Component({
  selector: 'ph-quiz-result-page',
  imports: [
    DatePipe,
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhQuizOption,
    PhSkeleton,
    PhStat,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quiz-result-page.html',
  styleUrl: './quiz-result-page.css',
})
export class QuizResultPage {
  private readonly api = inject(LEARNING_API);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter: the attempt. */
  readonly id = input.required<string>();

  /** The name the youth goes by, for “You passed, Sofía”. */
  protected readonly name = signal<string | null>(null);

  /** Null while loading. */
  protected readonly result = toSignal<GatedResult<QuizResult> | null>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.attempt(id).pipe(startWith<GatedResult<QuizResult> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  constructor() {
    this.api.onboarding().subscribe((s) => {
      if (s.status === 'loaded') this.name.set(s.value.preferredName);
    });
  }

  protected attemptText(r: QuizResult): string {
    return r.attemptsAllowed === null
      ? `Attempt ${r.number}`
      : `Attempt ${r.number} of ${r.attemptsAllowed}`;
  }

  protected passedText(r: QuizResult): string {
    const which = r.number === 1 ? 'on your first attempt' : `on attempt ${r.number}`;
    return `${r.score}% ${which}.${r.canRetake ? ' Your best score counts, so trying again can only raise it.' : ''}`;
  }

  protected notPassedText(r: QuizResult): string {
    const left =
      r.attemptsLeft === null
        ? 'you can try again'
        : `you have ${r.attemptsLeft} attempt${r.attemptsLeft === 1 ? '' : 's'} left`;
    return `You got ${r.score}%. You need ${r.passMark}% to pass and ${left}.`;
  }

  protected noneLeftText(r: QuizResult): string {
    return `You’ve used ${attemptsWord(r.attemptsAllowed ?? 0)}.${r.bestScore !== null ? ` Your best score, ${r.bestScore}%, is the one that counts.` : ''}`;
  }

  /** The options worth showing for a question: what she chose and what was correct, each marked. */
  protected rows(q: ReviewQuestion): ReviewRow[] {
    if (q.type === 'ShortAnswer') {
      const given = q.answerText?.trim();
      const rows: ReviewRow[] = [];
      if (given) {
        rows.push({
          key: '',
          label: given,
          mark: q.right ? 'correct' : 'wrong',
          note: q.right ? 'Your answer · correct' : 'Your answer · wrong',
        });
      }
      if (!q.right) {
        rows.push({
          key: '',
          label: q.accepted.join(', '),
          mark: 'missed',
          note: 'Correct answer',
        });
      }
      return rows;
    }
    return q.options
      .map((label, i): ReviewRow | null => {
        const chosen = q.chosen.includes(i);
        const correct = q.correctOptions.includes(i);
        if (chosen) {
          return {
            key: KEYS[i] ?? '',
            label,
            mark: correct ? 'correct' : 'wrong',
            note: correct ? 'Your answer · correct' : 'Your answer · wrong',
          };
        }
        if (correct) {
          return {
            key: KEYS[i] ?? '',
            label,
            mark: 'missed',
            note:
              q.type === 'MultipleAnswer' && q.chosen.length
                ? 'Correct answer · you didn’t choose it'
                : 'Correct answer',
          };
        }
        return null;
      })
      .filter((row): row is ReviewRow => row !== null);
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
