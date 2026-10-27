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
import { CURRICULUM_API, LoadResult, ModuleDetail, ModuleFields } from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  PhTextField,
  PhTextarea,
  SelectOption,
  ToastService,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { statusLabel, statusTone } from '../status-label';

/** The module editor (mock: curriculum-module, L2-066 criterion 4): details, prerequisite and anchor passage. */
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
}
