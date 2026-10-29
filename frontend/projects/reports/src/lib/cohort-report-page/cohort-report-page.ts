import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CohortReport,
  CohortYouth,
  LoadResult,
  ModuleId,
  PROGRAMS_API,
  REPORTS_API,
  SESSION_API,
} from '@promisehub/api';
import {
  BreadcrumbItem,
  Fact,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhErrorPage,
  PhPageHeader,
  PhProgressBar,
  PhSelect,
  PhSkeleton,
  PhStat,
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
import { EMPTY, catchError, map } from 'rxjs';

const STATUS: Record<
  CohortYouth['status'],
  { text: string; tone: 'success' | 'danger' | 'neutral' }
> = {
  OnTrack: { text: 'On track', tone: 'success' },
  AtRisk: { text: 'At risk', tone: 'danger' },
  Ended: { text: 'Ended', tone: 'neutral' },
};

/**
 * The cohort report (mock: report-cohort, L2-127): enrolment, retention and, while their module is on, attendance, learning and the at-risk
 * count; completion by module, the organization-wide comparison and each youth, whose name opens the youth report.
 */
@Component({
  selector: 'ph-cohort-report-page',
  imports: [
    FormsModule,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhErrorPage,
    PhPageHeader,
    PhProgressBar,
    PhSelect,
    PhSkeleton,
    PhStat,
    PhTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cohort-report-page.html',
  styleUrl: './cohort-report-page.css',
})
export class CohortReportPage {
  private readonly api = inject(REPORTS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly router = inject(Router);
  private readonly modules = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(
        map((s) => s.modules),
        catchError(() => EMPTY),
      ),
    { initialValue: [] as ModuleId[] },
  );
  private readonly programs = toSignal(
    inject(PROGRAMS_API)
      .list('active')
      .pipe(
        map((r): SelectOption[] =>
          r.status === 'loaded'
            ? r.value.programs.map((p) => ({ value: p.id, label: p.name }))
            : [],
        ),
      ),
    { initialValue: [] as SelectOption[] },
  );

  protected readonly programId = signal('');
  protected readonly result = signal<LoadResult<CohortReport> | null>(null);
  protected readonly report = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });
  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Reports', link: '/reports' },
    { label: 'Cohort report' },
  ];
  protected readonly rollCallOn = computed(() => this.modules().includes('RollCall'));
  protected readonly cohortOptions = computed<SelectOption[]>(() => {
    const options = this.programs();
    const r = this.report();
    return r && !options.some((o) => o.value === r.programId)
      ? [{ value: r.programId, label: r.name }, ...options]
      : options;
  });
  protected readonly columns = computed<TableColumn[]>(() => {
    const r = this.report();
    if (!r) return [];
    return [
      { key: 'name', label: 'Youth' },
      ...(r.learning ? [{ key: 'learning', label: 'Learning', numeric: true }] : []),
      ...(this.rollCallOn() ? [{ key: 'attendance', label: 'Attendance', numeric: true }] : []),
      ...(r.atRisk !== null
        ? [{ key: 'checkIns', label: 'Check-ins', numeric: true, hideOnPhone: true }]
        : []),
      { key: 'status', label: 'Status' },
    ];
  });
  protected readonly rows = computed<Record<string, TableCell>[]>(() =>
    (this.report()?.youth ?? []).map((y) => ({
      name: { text: y.name, link: ['/reports/youth', y.childId] },
      learning: y.hasAccount ? percent(y.learning) : 'No account',
      attendance: percent(y.attendanceRate),
      checkIns: y.checkIns === null ? '—' : `${y.checkIns}`,
      status: STATUS[y.status],
    })),
  );
  protected readonly comparison = computed<Fact[]>(() => {
    const r = this.report();
    if (!r) return [];
    const line = (attendance: number | null, retention: number | null, completion: number | null) =>
      [
        this.rollCallOn() ? `Attendance ${percent(attendance)}` : null,
        `Retention ${percent(retention)}`,
        r.learning ? `Completion ${percent(completion)}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
    return [
      {
        key: 'cohort',
        term: 'This cohort',
        value: line(r.attendanceRate, r.retentionRate, r.learning?.averageCompletion ?? null),
      },
      {
        key: 'organization',
        term: 'Every active program',
        value: line(
          r.comparison.attendanceRate,
          r.comparison.retentionRate,
          r.comparison.averageCompletion,
        ),
      },
    ];
  });

  constructor() {
    inject(ActivatedRoute).paramMap.subscribe((params) => {
      this.programId.set(params.get('programId')!);
      this.load();
    });
  }

  /** Exports exactly what the report shows (dialog: export-report, L2-129). */
  protected openExport(report: CohortReport): void {
    this.dialogs.open<void, ExportReportDialogData, ExportReportDialog>(ExportReportDialog, {
      request: { kind: 'Cohort', programId: report.programId, days: null },
      title: 'Export cohort report',
      description: report.name,
    });
  }

  protected load(): void {
    this.result.set(null);
    this.api.cohort(this.programId()).subscribe((r) => this.result.set(r));
  }

  protected choose(programId: string): void {
    if (programId && programId !== this.programId()) {
      void this.router.navigate(['/reports/cohorts', programId]);
    }
  }

  protected percent(value: number | null): string {
    return percent(value);
  }
}

function percent(value: number | null): string {
  return value === null ? '—' : `${value}%`;
}
