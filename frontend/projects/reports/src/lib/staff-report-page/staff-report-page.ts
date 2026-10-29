import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadResult, MentorActivityRow, REPORTS_API, StaffReport } from '@promisehub/api';
import {
  BreadcrumbItem,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhErrorPage,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  PhStat,
  PhTable,
  SelectOption,
  TableCell,
  TableColumn,
} from '@promisehub/components';

const LOAD: Record<
  MentorActivityRow['load'],
  { text: string; tone: 'warning' | 'success' | 'neutral' }
> = {
  Overloaded: { text: 'Overloaded', tone: 'warning' },
  Balanced: { text: 'Balanced', tone: 'success' },
  Underloaded: { text: 'Underloaded', tone: 'neutral' },
};

/** Staff activity (mock: report-staff, L2-128): each mentor's cohorts, youth, check-ins and reviews, and the load against 4 to 8. */
@Component({
  selector: 'ph-staff-report-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhErrorPage,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
    PhStat,
    PhTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './staff-report-page.html',
  styleUrl: './staff-report-page.css',
})
export class StaffReportPage {
  private readonly api = inject(REPORTS_API);

  protected readonly period = signal('');
  protected readonly periods: SelectOption[] = [
    { value: '', label: 'All time' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
  ];
  protected readonly result = signal<LoadResult<StaffReport> | null>(null);
  protected readonly report = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });
  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Reports', link: '/reports' },
    { label: 'Staff activity' },
  ];
  protected readonly columns = computed<TableColumn[]>(() => [
    { key: 'name', label: 'Mentor' },
    { key: 'cohorts', label: 'Cohorts', hideOnPhone: true },
    { key: 'caseload', label: 'Youth', numeric: true },
    { key: 'checkIns', label: 'Check-ins', numeric: true },
    ...(this.report()?.reviews !== null
      ? [{ key: 'reviews', label: 'Reviews', numeric: true }]
      : []),
    { key: 'load', label: 'Load' },
  ]);
  protected readonly rows = computed<Record<string, TableCell>[]>(() =>
    (this.report()?.mentors ?? []).map((m) => ({
      name: m.name,
      cohorts:
        m.cohorts.map((c) => `${c.name} (${c.lead ? 'lead' : 'supporting'})`).join(', ') || '—',
      caseload: `${m.caseload}`,
      checkIns: `${m.checkIns}`,
      reviews: m.reviews === null ? '—' : `${m.reviews}`,
      load: LOAD[m.load],
    })),
  );
  protected readonly overloaded = computed(() =>
    (this.report()?.mentors ?? []).filter((m) => m.load === 'Overloaded'),
  );
  protected readonly underloaded = computed(() =>
    (this.report()?.mentors ?? []).filter((m) => m.load === 'Underloaded'),
  );

  constructor() {
    this.load();
  }

  protected choose(period: string): void {
    this.period.set(period);
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    const days = this.period() ? (Number(this.period()) as 30 | 90) : null;
    this.api.staff(days).subscribe((r) => this.result.set(r));
  }

  protected warningText(): string {
    const free = this.underloaded()[0];
    return `Above the target of 4 to 8.${free ? ` ${free.name} has ${free.caseload} and can take more.` : ''}`;
  }
}
