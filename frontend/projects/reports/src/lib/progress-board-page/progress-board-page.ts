import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadResult, PROGRAMS_API, ProgressBoard, REPORTS_API } from '@promisehub/api';
import {
  BreadcrumbItem,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhErrorPage,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  PhTable,
  SelectOption,
  TableCell,
  TableColumn,
  PhDialogs,
} from '@promisehub/components';
import {
  ExportReportDialog,
  ExportReportDialogData,
} from '../export-report-dialog/export-report-dialog';
import { map } from 'rxjs';

const CELL: Record<
  ProgressBoard['youth'][number]['cells'][number],
  { text: string; tone: 'success' | 'info' | 'neutral' }
> = {
  Done: { text: 'Done', tone: 'success' },
  InProgress: { text: 'In progress', tone: 'info' },
  NotStarted: { text: 'Not started', tone: 'neutral' },
  NoAccount: { text: 'No account', tone: 'neutral' },
};

/** The progress board (mock: progress-board, L2-131): every youth of a cohort against every module of its track, the spreadsheet replaced. */
@Component({
  selector: 'ph-progress-board-page',
  imports: [
    FormsModule,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorPage,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
    PhTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-board-page.html',
  styleUrl: './progress-board-page.css',
})
export class ProgressBoardPage {
  private readonly api = inject(REPORTS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly programs = signal<SelectOption[] | null>(null);
  protected readonly programId = toSignal(
    this.route.queryParamMap.pipe(map((q) => q.get('programId'))),
    {
      initialValue: null,
    },
  );
  protected readonly result = signal<LoadResult<ProgressBoard> | null>(null);
  protected readonly board = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });
  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Reports', link: '/reports' },
    { label: 'Progress board' },
  ];
  protected readonly legend = Object.values(CELL);
  protected readonly columns = computed<TableColumn[]>(() => [
    { key: 'name', label: 'Youth' },
    ...(this.board()?.modules ?? []).map((m) => ({ key: m.moduleId, label: m.title })),
    { key: 'quiz', label: 'Quiz average', numeric: true },
    { key: 'overall', label: 'Overall', numeric: true },
  ]);
  protected readonly rows = computed<Record<string, TableCell>[]>(() => {
    const b = this.board();
    if (!b) return [];
    return b.youth.map((y) => ({
      name: y.name,
      ...Object.fromEntries(b.modules.map((m, i) => [m.moduleId, CELL[y.cells[i]]])),
      quiz: percent(y.quizAverage),
      overall: percent(y.overall),
    }));
  });
  protected readonly footer = computed<Record<string, TableCell> | null>(() => {
    const b = this.board();
    if (!b) return null;
    return {
      name: 'Cohort average',
      ...Object.fromEntries(b.modules.map((m, i) => [m.moduleId, percent(b.average.modules[i])])),
      quiz: percent(b.average.quizAverage),
      overall: percent(b.average.overall),
    };
  });

  constructor() {
    inject(PROGRAMS_API)
      .list('active')
      .subscribe((r) => {
        this.programs.set(
          r.status === 'loaded'
            ? r.value.programs.map((p) => ({ value: p.id, label: p.name }))
            : [],
        );
        this.load();
      });
    this.route.queryParamMap.subscribe(() => {
      if (this.programs()) this.load();
    });
  }

  /** The chosen cohort: the one in the address, else the first active program. */
  protected chosen(): string | null {
    return this.programId() ?? this.programs()?.[0]?.value ?? null;
  }

  /** Exports the board for the chosen cohort (dialog: export-report, L2-129). */
  protected openExport(board: ProgressBoard): void {
    this.dialogs.open<void, ExportReportDialogData, ExportReportDialog>(ExportReportDialog, {
      request: { kind: 'Progress', programId: board.programId, days: null },
      title: 'Export progress board',
      description: board.programName + (board.trackName ? ' · ' + board.trackName : ''),
    });
  }

  protected load(): void {
    const id = this.chosen();
    this.result.set(null);
    if (!id) {
      this.result.set({ status: 'not-found' });
      return;
    }
    this.api.progress(id).subscribe((r) => this.result.set(r));
  }

  protected choose(programId: string): void {
    void this.router.navigate([], { queryParams: { programId }, replaceUrl: true });
  }
}

function percent(value: number | null): string {
  return value === null ? '—' : `${value}%`;
}
