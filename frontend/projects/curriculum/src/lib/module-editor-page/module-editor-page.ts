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
import {
  CURRICULUM_API,
  LessonSummary,
  LoadResult,
  ModuleDetail,
  ModuleFields,
} from '@promisehub/api';
import { Router } from '@angular/router';
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
  PhList,
  PhListItem,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  PhTextField,
  PhTextarea,
  SelectOption,
  ToastService,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { CurriculumStatusDialog } from '../curriculum-status-dialog/curriculum-status-dialog';
import { CurriculumStatusDialogData } from '../curriculum-status-dialog/curriculum-status-dialog-data';
import { NewLessonDialog } from '../new-lesson-dialog/new-lesson-dialog';
import { NewLessonDialogData } from '../new-lesson-dialog/new-lesson-dialog-data';
import { statusLabel, statusTone } from '../status-label';

/** The module editor (mock: curriculum-module, L2-066 criteria 4 and 6, L2-067 criteria 1 and 3): details, lessons in order and status. */
@Component({
  selector: 'ph-module-editor-page',
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
    PhList,
    PhListItem,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './module-editor-page.html',
})
export class ModuleEditorPage {
  private readonly api = inject(CURRICULUM_API);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(PhDialogs);
  private readonly router = inject(Router);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly moduleId = input.required<string>();

  protected readonly result = toSignal<LoadResult<ModuleDetail> | null>(
    toObservable(this.moduleId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.module(id).pipe(startWith<LoadResult<ModuleDetail> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );
  protected fields: ModuleFields = {
    title: '',
    description: '',
    prerequisiteModuleId: null,
    anchor: '',
  };
  protected prerequisite = '';
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([field, message]) => ({
      field: field === 'prerequisiteModuleId' ? 'prerequisite' : field === 'title' ? 'name' : field,
      message,
    })),
  );
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly statusLabel = statusLabel;
  protected readonly statusTone = statusTone;

  constructor() {
    effect(() => {
      const r = this.result();
      if (r?.status !== 'loaded') return;
      const m = r.value;
      this.fields = {
        title: m.title,
        description: m.description ?? '',
        prerequisiteModuleId: m.prerequisiteModuleId,
        anchor: m.anchor ?? '',
      };
      this.prerequisite = m.prerequisiteModuleId ?? '';
    });
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected prerequisiteOptions(m: ModuleDetail): SelectOption[] {
    return [
      { value: '', label: 'None' },
      ...m.earlierModules.map((e) => ({ value: e.id, label: e.title })),
    ];
  }

  protected subtitle(m: ModuleDetail): string {
    return `Module ${m.position} of ${m.moduleCount} in ${m.trackName}`;
  }

  protected save(m: ModuleDetail): void {
    this.busy.set(true);
    this.failed.set(false);
    const fields = { ...this.fields, prerequisiteModuleId: this.prerequisite || null };
    this.api.updateModule(m.id, fields).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.errors.set({});
        this.toasts.show({ tone: 'success', title: 'Module saved', text: fields.title.trim() });
        this.reload();
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }

  protected lessonMeta(l: LessonSummary): string {
    return [l.minutes ? `${l.minutes} min` : null, statusLabel(l.status)]
      .filter(Boolean)
      .join(' · ');
  }

  protected addLesson(m: ModuleDetail): void {
    this.dialogs
      .open<string, NewLessonDialogData, NewLessonDialog>(NewLessonDialog, {
        moduleId: m.id,
        moduleTitle: m.title,
      })
      .closed.subscribe((id) => id && void this.router.navigate(['/curriculum/lessons', id]));
  }

  protected changeStatus(m: ModuleDetail): void {
    this.dialogs
      .open<boolean, CurriculumStatusDialogData, CurriculumStatusDialog>(CurriculumStatusDialog, {
        kind: 'module',
        id: m.id,
        name: m.title,
        status: m.status,
        audience: `The cohorts that follow ${m.trackName}, once the track is published`,
      })
      .closed.subscribe((saved) => saved && this.reload());
  }

  protected moveLesson(m: ModuleDetail, index: number, by: -1 | 1): void {
    const ids = m.lessons.map((l) => l.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + by, 0, moved!);
    this.api.reorderLessons(m.id, ids).subscribe((outcome) => {
      if (outcome.status === 'saved') {
        this.reload();
      } else {
        this.toasts.show({ tone: 'danger', title: 'The order was not saved', text: 'Try again.' });
      }
    });
  }
}
