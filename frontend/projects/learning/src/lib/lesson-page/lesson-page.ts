import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { GatedResult, LEARNING_API, LessonCompletion, LessonView } from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhScriptureBlock,
  PhSkeleton,
  ToastService,
} from '@promisehub/components';
import { Subject, startWith, switchMap, tap } from 'rxjs';
import { lessonLink } from '../lesson-link';

type TextSize = 'md' | 'lg' | 'xl';
const SIZES: TextSize[] = ['md', 'lg', 'xl'];

/**
 * A reading or scripture lesson (mocks: learn-lesson, learn-lesson-scripture; L2-069): objectives, teaching, the passage in a
 * scripture block with A− and A+, and Mark complete, which is saved on the server and unlocks what comes next.
 */
@Component({
  selector: 'ph-lesson-page',
  imports: [
    NgTemplateOutlet,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhScriptureBlock,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-page.html',
  styleUrl: './lesson-page.css',
})
export class LessonPage {
  private readonly api = inject(LEARNING_API);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();
  protected readonly lessonLink = lessonLink;

  /** Route parameter. */
  readonly id = input.required<string>();

  protected readonly size = signal<TextSize>('md');
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  /** The server's answer to Mark complete, once given. */
  protected readonly completion = signal<LessonCompletion | null>(null);

  /** Null while loading. */
  protected readonly result = toSignal<GatedResult<LessonView> | null>(
    toObservable(this.id).pipe(
      tap(() => {
        this.completion.set(null);
        this.failed.set(false);
      }),
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.lesson(id).pipe(startWith<GatedResult<LessonView> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected subtitle(l: LessonView): string {
    return [
      l.moduleTitle,
      `Lesson ${l.position} of ${l.lessonCount}`,
      l.minutes ? `${l.minutes} min` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  protected step(by: 1 | -1): void {
    const i = SIZES.indexOf(this.size()) + by;
    this.size.set(SIZES[Math.min(Math.max(i, 0), SIZES.length - 1)]!);
  }

  /** What follows once the lesson is done: from the completion answer, or from the lesson itself when it was done before. */
  protected after(l: LessonView): {
    title: string | null;
    link: string[] | null;
    moduleDone: boolean;
  } {
    const c = this.completion();
    if (c) {
      return {
        title: c.nextLessonTitle,
        link:
          c.nextLessonId && c.nextLessonKind ? lessonLink(c.nextLessonKind, c.nextLessonId) : null,
        moduleDone: c.moduleCompleted,
      };
    }
    return {
      title: l.next?.title ?? null,
      link: l.next ? lessonLink(l.next.kind, l.next.id) : null,
      moduleDone: !l.next,
    };
  }

  protected complete(l: LessonView): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.completeLesson(l.id).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'loaded') {
        this.completion.set(outcome.value);
        this.toasts.show({ tone: 'success', title: 'Lesson complete', text: l.title });
      } else {
        this.failed.set(true);
      }
    });
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
