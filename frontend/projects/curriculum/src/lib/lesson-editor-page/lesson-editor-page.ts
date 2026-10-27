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
import { Router } from '@angular/router';
import { CURRICULUM_API, LessonDetail, LoadResult } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhSkeleton,
  PhTextField,
  PhTextarea,
  ToastService,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { CurriculumStatusDialog } from '../curriculum-status-dialog/curriculum-status-dialog';
import { CurriculumStatusDialogData } from '../curriculum-status-dialog/curriculum-status-dialog-data';
import { DeleteLessonDialog } from '../delete-lesson-dialog/delete-lesson-dialog';
import { DeleteLessonDialogData } from '../delete-lesson-dialog/delete-lesson-dialog-data';
import { statusLabel, statusTone } from '../status-label';

/** The lesson editor (mock: curriculum-lesson, L2-067): content, leader notes, status and delete. */
@Component({
  selector: 'ph-lesson-editor-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhSkeleton,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-editor-page.html',
})
export class LessonEditorPage {
  private readonly api = inject(CURRICULUM_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly lessonId = input.required<string>();

  protected readonly result = toSignal<LoadResult<LessonDetail> | null>(
    toObservable(this.lessonId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.lesson(id).pipe(startWith<LoadResult<LessonDetail> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );
  protected form = {
    title: '',
    reading: '',
    minutes: '',
    objectives: '',
    body: '',
    prompts: '',
    leaderNotes: '',
  };
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([field, message]) => ({ field, message })),
  );
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly statusLabel = statusLabel;
  protected readonly statusTone = statusTone;

  constructor() {
    effect(() => {
      const r = this.result();
      if (r?.status !== 'loaded') return;
      const l = r.value;
      this.form = {
        title: l.title,
        reading: l.reading ?? '',
        minutes: l.minutes === null ? '' : `${l.minutes}`,
        objectives: l.objectives.join('\n'),
        body: l.body ?? '',
        prompts: l.prompts.join('\n'),
        leaderNotes: l.leaderNotes ?? '',
      };
    });
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected subtitle(l: LessonDetail): string {
    return `${l.moduleTitle} · Lesson ${l.position} of ${l.lessonCount}`;
  }

  protected save(l: LessonDetail): void {
    this.busy.set(true);
    this.failed.set(false);
    const lines = (text: string) => text.split('\n').filter((line) => line.trim());
    const minutes = `${this.form.minutes}`.trim();
    this.api
      .updateLesson(l.id, {
        title: this.form.title,
        reading: this.form.reading,
        minutes: minutes === '' ? null : Number(minutes),
        objectives: lines(this.form.objectives),
        body: this.form.body,
        prompts: lines(this.form.prompts),
        leaderNotes: this.form.leaderNotes,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.errors.set({});
          this.toasts.show({
            tone: 'success',
            title: 'Lesson saved',
            text: this.form.title.trim(),
          });
          this.reload();
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else {
          this.failed.set(true);
        }
      });
  }

  protected changeStatus(l: LessonDetail): void {
    this.dialogs
      .open<boolean, CurriculumStatusDialogData, CurriculumStatusDialog>(CurriculumStatusDialog, {
        kind: 'lesson',
        id: l.id,
        name: l.title,
        status: l.status,
        audience: `The cohorts that follow ${l.trackName}, once ${l.moduleTitle} is published`,
      })
      .closed.subscribe((saved) => saved && this.reload());
  }

  protected delete(l: LessonDetail): void {
    this.dialogs
      .open<boolean, DeleteLessonDialogData, DeleteLessonDialog>(DeleteLessonDialog, {
        id: l.id,
        title: l.title,
      })
      .closed.subscribe((deleted) => {
        if (!deleted) return;
        this.toasts.show({ tone: 'success', title: 'Lesson deleted', text: l.title });
        void this.router.navigate(['/curriculum/modules', l.moduleId]);
      });
  }
}
