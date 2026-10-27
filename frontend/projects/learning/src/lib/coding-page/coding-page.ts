import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CodingSaved, CodingView, GatedResult, LEARNING_API } from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhCheckboxGroup,
  PhCodePlayground,
  PhCodeSample,
  PhEmptyState,
  PhPageHeader,
  PhProgressBar,
  PhSkeleton,
  ToastService,
} from '@promisehub/components';
import { Subject, startWith, switchMap, tap } from 'rxjs';
import { lessonLink } from '../lesson-link';

/**
 * A coding lesson (mock: learn-coding-lesson, L2-070): steps with code samples, the playground, and the checklist; Save progress
 * keeps the code and ticks on the server and ticking every item completes the lesson.
 */
@Component({
  selector: 'ph-coding-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhCheckboxGroup,
    PhCodePlayground,
    PhCodeSample,
    PhEmptyState,
    PhPageHeader,
    PhProgressBar,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coding-page.html',
  styleUrl: './coding-page.css',
})
export class CodingPage {
  private readonly api = inject(LEARNING_API);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly id = input.required<string>();

  protected readonly code = signal('');
  protected readonly ticked = signal<string[]>([]);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  /** The answer to the save that completed the lesson. */
  protected readonly saved = signal<CodingSaved | null>(null);

  /** Null while loading. */
  protected readonly result = toSignal<GatedResult<CodingView> | null>(
    toObservable(this.id).pipe(
      tap(() => {
        this.saved.set(null);
        this.failed.set(false);
        this.errors.set({});
      }),
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.coding(id).pipe(
              tap((r) => {
                if (r.status === 'loaded') {
                  this.code.set(r.value.code);
                  this.ticked.set(r.value.checkedStepIds);
                }
              }),
              startWith<GatedResult<CodingView> | null>(null),
            ),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected subtitle(c: CodingView): string {
    return [
      c.moduleTitle,
      `Lesson ${c.position} of ${c.lessonCount}`,
      c.kind === 'Project' ? 'Project' : 'Coding',
      c.minutes ? `${c.minutes} min` : null,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  protected options(c: CodingView) {
    return c.steps.map((s) => ({ value: s.id, label: s.checkLabel }));
  }

  /** What follows once the lesson is done. */
  protected after(c: CodingView): { title: string | null; link: string[] | null } {
    const s = this.saved();
    if (s) {
      return {
        title: s.nextLessonTitle,
        link:
          s.nextLessonId && s.nextLessonKind ? lessonLink(s.nextLessonKind, s.nextLessonId) : null,
      };
    }
    return {
      title: c.next?.title ?? null,
      link: c.next ? lessonLink(c.next.kind, c.next.id) : null,
    };
  }

  protected save(c: CodingView): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .saveCoding(c.id, { code: this.code(), checkedStepIds: this.ticked() })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'loaded') {
          if (outcome.value.done) {
            this.saved.set(outcome.value);
            this.toasts.show({ tone: 'success', title: 'Lesson complete', text: c.title });
          } else {
            this.toasts.show({
              tone: 'success',
              title: 'Progress saved',
              text: `${outcome.value.checked} of ${outcome.value.total} checked`,
            });
          }
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
