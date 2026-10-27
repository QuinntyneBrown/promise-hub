import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { GatedResult, LEARNING_API, LessonItem, ModuleView, QuizItem } from '@promisehub/api';
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
  PhProgressBar,
  PhScriptureBlock,
  PhSkeleton,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { lessonLink } from '../lesson-link';
import { STATUS_LABEL, STATUS_TONE } from '../status-label';

/** A module of the youth's track (mock: learn-module, L2-068 criteria 3 and 4, L2-075 criterion 2): lessons in order and its quizzes; locked until its prerequisite is done. */
@Component({
  selector: 'ph-module-page',
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
    PhProgressBar,
    PhScriptureBlock,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './module-page.html',
})
export class ModulePage {
  private readonly api = inject(LEARNING_API);
  private readonly refresh$ = new Subject<void>();
  protected readonly label = STATUS_LABEL;
  protected readonly tone = STATUS_TONE;
  protected readonly lessonLink = lessonLink;

  /** Route parameter. */
  readonly id = input.required<string>();

  /** Null while loading. */
  protected readonly result = toSignal<GatedResult<ModuleView> | null>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.module(id).pipe(startWith<GatedResult<ModuleView> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected subtitle(m: ModuleView): string {
    return [`Module ${m.position} of ${m.moduleCount}`, m.description].filter(Boolean).join(' · ');
  }

  protected meta(l: LessonItem): string {
    const kind = {
      Reading: 'Reading',
      Scripture: 'Scripture',
      Coding: 'Coding',
      Project: 'Project',
    }[l.kind];
    const parts = [kind, l.reading, l.minutes ? `${l.minutes} min` : null];
    if (l.status === 'locked') parts.push(`Unlocks after ${l.unlockAfter}`);
    return parts.filter(Boolean).join(' · ');
  }

  protected next(m: ModuleView): LessonItem | undefined {
    return m.lessons.find((l) => l.status === 'next');
  }

  protected quizMeta(q: QuizItem): string {
    const parts = [`Quiz · ${q.questionCount} question${q.questionCount === 1 ? '' : 's'}`];
    if (q.status === 'locked') parts.push(`Unlocks after ${q.unlockAfter}`);
    else if (q.bestScore !== null) parts.push(`Best score ${q.bestScore}%`);
    if (q.required) parts.push('Required to finish the module');
    return parts.join(' · ');
  }

  /** A required quiz that is open and not passed, once every lesson is done. */
  protected openRequired(m: ModuleView): QuizItem | undefined {
    return m.quizzes.find((q) => q.required && q.status !== 'locked' && q.status !== 'passed');
  }

  protected requiredQuiz(m: ModuleView): boolean {
    return m.quizzes.some((q) => q.required);
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
