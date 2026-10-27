import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  AttemptQuestion,
  LEARNING_API,
  QuizAnswer,
  QuizAttemptView,
  StartQuizResult,
} from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhDialogs,
  PhPageHeader,
  PhProgressBar,
  PhQuizOption,
  PhSkeleton,
  PhSyncChip,
  PhTextField,
} from '@promisehub/components';
import { Router } from '@angular/router';
import { fromEvent, switchMap } from 'rxjs';
import { SubmitQuizDialog } from '../submit-quiz-dialog/submit-quiz-dialog';
import { SubmitQuizDialogData } from '../submit-quiz-dialog/submit-quiz-dialog-data';

const KEYS = 'ABCDEF';

/**
 * Taking a quiz one question at a time (mock: learn-quiz, L2-075 criteria 3 to 7): every answer and move saves on the server, one
 * save at a time with the latest answers winning; with no connection the answers stay on screen and save again once back online.
 */
@Component({
  selector: 'ph-quiz-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhProgressBar,
    PhQuizOption,
    PhSkeleton,
    PhSyncChip,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quiz-page.html',
  styleUrl: './quiz-page.css',
})
export class QuizPage {
  private readonly api = inject(LEARNING_API);
  private readonly destroyRef = inject(DestroyRef);
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly dialogs = inject(PhDialogs);
  private readonly router = inject(Router);
  protected readonly keys = KEYS;

  /** Route parameter: the quiz. */
  readonly id = input.required<string>();

  /** Null while starting. */
  protected readonly result = signal<StartQuizResult | null>(null);
  protected readonly index = signal(0);
  protected readonly answers = signal<Record<string, QuizAnswer>>({});
  /** The save chip: nothing yet, saving, saved, or not saved while offline. */
  protected readonly saveState = signal<'idle' | 'saving' | 'saved' | 'offline'>('idle');
  /** The attempt was submitted elsewhere (409): answers can no longer change. */
  protected readonly submittedElsewhere = signal(false);
  protected readonly saveFailed = signal(false);

  private inFlight = false;
  private dirty = false;

  protected readonly view = computed<QuizAttemptView | null>(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });

  protected readonly question = computed<AttemptQuestion | null>(
    () => this.view()?.questions[this.index()] ?? null,
  );

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap((id) => this.api.startQuiz(id)),
        takeUntilDestroyed(),
      )
      .subscribe((r) => {
        this.result.set(r);
        if (r.status === 'loaded') {
          this.index.set(Math.min(r.value.position, Math.max(0, r.value.questions.length - 1)));
          this.answers.set(Object.fromEntries(r.value.answers.map((a) => [a.questionId, a])));
        }
      });
    if (this.window) {
      fromEvent(this.window, 'online')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (this.saveState() === 'offline') this.flush();
        });
    }
  }

  protected subtitle(v: QuizAttemptView): string {
    const attempt =
      v.attemptsAllowed === null
        ? `Attempt ${v.number}`
        : `Attempt ${v.number} of ${v.attemptsAllowed}`;
    return `${attempt} · Question ${this.index() + 1} of ${v.questions.length}`;
  }

  protected hint(q: AttemptQuestion): string | null {
    return q.type === 'MultipleAnswer'
      ? 'Choose every answer that fits.'
      : q.type === 'ShortAnswer'
        ? null
        : 'Choose one.';
  }

  protected chosen(q: AttemptQuestion, option: number): boolean {
    return this.answers()[q.id]?.choices?.includes(option) ?? false;
  }

  protected text(q: AttemptQuestion): string {
    return this.answers()[q.id]?.text ?? '';
  }

  protected choose(q: AttemptQuestion, option: number, checked: boolean): void {
    const current = this.answers()[q.id]?.choices ?? [];
    const choices =
      q.type === 'MultipleAnswer'
        ? (checked ? [...current, option] : current.filter((c) => c !== option)).sort(
            (a, b) => a - b,
          )
        : [option];
    this.answers.update((all) => ({ ...all, [q.id]: { questionId: q.id, choices, text: null } }));
    this.queue();
  }

  protected write(q: AttemptQuestion, text: string): void {
    this.answers.update((all) => ({ ...all, [q.id]: { questionId: q.id, choices: null, text } }));
    this.queue();
  }

  protected move(delta: number): void {
    const v = this.view();
    if (!v) return;
    this.index.set(Math.max(0, Math.min(v.questions.length - 1, this.index() + delta)));
    this.queue();
  }

  /** Every answer with something in it, in the attempt's order. */
  protected list(): QuizAnswer[] {
    const v = this.view();
    if (!v) return [];
    return v.questions
      .map((q) => this.answers()[q.id])
      .filter((a): a is QuizAnswer => !!a && ((a.choices?.length ?? 0) > 0 || !!a.text?.trim()));
  }

  /** Opens submit-quiz with every answer so far; once submitted, the result opens. */
  protected submit(v: QuizAttemptView): void {
    const answered = new Set(this.list().map((a) => a.questionId));
    this.dialogs
      .open<boolean | 'submitted', SubmitQuizDialogData, SubmitQuizDialog>(SubmitQuizDialog, {
        attemptId: v.attemptId,
        title: v.title,
        number: v.number,
        attemptsAllowed: v.attemptsAllowed,
        total: v.questions.length,
        answers: this.list(),
        position: this.index(),
        blank: v.questions.map((q, i) => (answered.has(q.id) ? 0 : i + 1)).filter((n) => n > 0),
      })
      .closed.subscribe((done) => {
        if (done === true) void this.router.navigate(['/learning/attempts', v.attemptId]);
        else if (done === 'submitted') this.submittedElsewhere.set(true);
      });
  }

  private queue(): void {
    this.dirty = true;
    this.flush();
  }

  /** Sends the latest answers; one save at a time, and a change made meanwhile is sent when it returns. */
  private flush(): void {
    const v = this.view();
    if (!v || this.inFlight || !this.dirty || this.submittedElsewhere()) return;
    this.dirty = false;
    this.inFlight = true;
    this.saveState.set('saving');
    this.api.saveAnswers(v.attemptId, this.list(), this.index()).subscribe((outcome) => {
      this.inFlight = false;
      if (outcome.status === 'saved') {
        this.saveFailed.set(false);
        this.saveState.set(this.dirty ? 'saving' : 'saved');
        this.flush();
      } else if (outcome.status === 'offline') {
        this.dirty = true;
        this.saveState.set('offline');
      } else if (outcome.status === 'submitted') {
        this.submittedElsewhere.set(true);
      } else {
        this.saveState.set('idle');
        this.saveFailed.set(true);
      }
    });
  }
}
