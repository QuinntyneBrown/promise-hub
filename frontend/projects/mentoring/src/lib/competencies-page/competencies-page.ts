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
  CompetencyItem,
  CompetencyLevel,
  CompetencySheet,
  LoadResult,
  MENTORING_API,
} from '@promisehub/api';
import {
  ButtonGroupOption,
  ErrorSummaryItem,
  PhAlert,
  PhAvatar,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhButtonGroup,
  PhCard,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhSkeleton,
  PhTextarea,
  ToastService,
  formatDate,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';

const LEVEL_LABEL: Record<CompetencyLevel, string> = {
  NotStarted: 'Not started',
  Developing: 'Developing',
  Proficient: 'Proficient',
  Mastered: 'Mastered',
};

/**
 * A youth's competencies for their mentor (mock: mentor-competency, L2-082): each competency of the organization with its level in a button
 * group and a note; Save changes sends them all and the server keeps a new assessment for each one that changed.
 */
@Component({
  selector: 'ph-competencies-page',
  imports: [
    FormsModule,
    PhAlert,
    PhAvatar,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhButtonGroup,
    PhCard,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhSkeleton,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './competencies-page.html',
  styleUrl: './competencies-page.css',
})
export class CompetenciesPage {
  private readonly api = inject(MENTORING_API);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly childId = input.required<string>();

  protected readonly label = LEVEL_LABEL;
  protected readonly options: ButtonGroupOption[] = (
    Object.keys(LEVEL_LABEL) as CompetencyLevel[]
  ).map((value) => ({ value, label: LEVEL_LABEL[value] }));

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<CompetencySheet> | null>(
    toObservable(this.childId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.competencies(id).pipe(startWith<LoadResult<CompetencySheet> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected readonly levels = signal<Record<string, CompetencyLevel>>({});
  protected readonly notes = signal<Record<string, string>>({});
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: this.fieldId(key), message })),
  );

  constructor() {
    effect(() => {
      const r = this.result();
      if (r?.status !== 'loaded') return;
      this.levels.set(Object.fromEntries(r.value.items.map((i) => [i.id, i.level])));
      this.notes.set(Object.fromEntries(r.value.items.map((i) => [i.id, i.notes ?? ''])));
    });
  }

  protected count(sheet: CompetencySheet): string {
    const done = sheet.items.filter((i) => {
      const level = this.levels()[i.id] ?? i.level;
      return level === 'Proficient' || level === 'Mastered';
    }).length;
    return `${done} of ${sheet.total} proficient or mastered`;
  }

  protected lastSaved(sheet: CompetencySheet): string | null {
    const latest = sheet.items
      .filter((i) => i.assessedAt)
      .sort((a, b) => b.assessedAt!.localeCompare(a.assessedAt!))[0];
    return latest ? `Last saved ${formatDate(latest.assessedAt!)} by ${latest.assessedBy}` : null;
  }

  protected tone(level: CompetencyLevel): 'neutral' | 'info' | 'success' {
    return level === 'NotStarted' ? 'neutral' : level === 'Developing' ? 'info' : 'success';
  }

  protected level(item: CompetencyItem): CompetencyLevel {
    return this.levels()[item.id] ?? item.level;
  }

  protected setLevel(item: CompetencyItem, value: string): void {
    this.levels.update((all) => ({ ...all, [item.id]: value as CompetencyLevel }));
  }

  protected setNotes(item: CompetencyItem, value: string): void {
    this.notes.update((all) => ({ ...all, [item.id]: value }));
  }

  protected save(sheet: CompetencySheet): void {
    const errors: Record<string, string> = {};
    sheet.items.forEach((item, i) => {
      if ((this.notes()[item.id] ?? '').trim().length > 2000)
        errors[`items.${i}.notes`] = 'Keep the note to 2,000 characters.';
    });
    this.errors.set(errors);
    if (Object.keys(errors).length) return;
    this.busy.set(true);
    this.failed.set(false);
    const items = sheet.items.map((item) => ({
      competencyId: item.id,
      level: this.level(item),
      notes: (this.notes()[item.id] ?? '').trim() || null,
    }));
    this.api.saveCompetencies(this.childId(), items).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({ tone: 'success', title: 'Competencies saved', text: sheet.name });
        this.refresh$.next();
      } else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }

  protected reload(): void {
    this.refresh$.next();
  }

  private fieldId(key: string): string {
    const m = /^items\.(\d+)\.notes$/.exec(key);
    return m ? `notes-${Number(m[1]) + 1}` : key;
  }
}
