import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LEARNING_BOND_API,
  LearningBondDashboard,
  LearningBondDollars,
  LearningBondFigures,
  LoadResult,
} from '@promisehub/api';
import {
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  PhStat,
  PhTable,
  SelectOption,
  TableCell,
  TableColumn,
} from '@promisehub/components';
import { LearningBondExportDialog } from './learning-bond-export-dialog';

/**
 * The Learning Bond dashboard (learning-bond-dashboard, L2-141): six figures for the organization, each dollar figure split into Learning
 * Bond and benefits, filtered by covered program and period, and a row per covered program. Counts and sums, never a family; fewer than 5
 * households reads Fewer than 5 and its dollars are withheld. ViewReports only.
 */
@Component({
  selector: 'ph-learning-bond-dashboard-page',
  imports: [
    FormsModule,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
    PhStat,
    PhTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-dashboard-page.html',
  styleUrl: './learning-bond-dashboard-page.css',
})
export class LearningBondDashboardPage implements OnInit {
  private readonly api = inject(LEARNING_BOND_API);
  private readonly dialogs = inject(PhDialogs);

  protected readonly result = signal<LoadResult<LearningBondDashboard> | null>(null);
  protected program = '';
  protected period = 'all';
  protected readonly periods: SelectOption[] = [
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ];
  protected readonly programOptions = computed<SelectOption[]>(() => {
    const r = this.result();
    const programs = r?.status === 'loaded' ? r.value.programs : [];
    return [
      { value: '', label: 'All covered programs' },
      ...programs.map((p) => ({ value: p.id, label: p.name })),
    ];
  });
  protected readonly columns: TableColumn[] = [
    { key: 'program', label: 'Program' },
    { key: 'invited', label: 'Invited', numeric: true },
    { key: 'started', label: 'Started', numeric: true },
    { key: 'completed', label: 'Completed', numeric: true, hideOnPhone: true },
    { key: 'children', label: 'Children', numeric: true, hideOnPhone: true },
    { key: 'estimated', label: 'Estimated', numeric: true },
    { key: 'confirmed', label: 'Confirmed', numeric: true },
  ];

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.dashboard(this.program || null, this.period).subscribe((r) => this.result.set(r));
  }

  private readonly currency = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  });

  protected money(n: number): string {
    return this.currency.format(n);
  }

  protected count(value: string): string {
    return value === 'FewerThan5' ? 'Fewer than 5' : value;
  }

  protected dollars(d: LearningBondDollars | null): string {
    return d ? this.money(d.total) : '—';
  }

  protected split(d: LearningBondDollars | null): string {
    return d
      ? `Learning Bond ${this.money(d.learningBond)} · benefits ${this.money(d.benefits)}`
      : 'Withheld: fewer than 5 households';
  }

  protected rows(rows: LearningBondFigures[]): Record<string, TableCell>[] {
    return rows.map((r) => ({
      program: r.program,
      invited: this.count(r.invited),
      started: this.count(r.started),
      completed: this.count(r.completed),
      children: this.count(r.children),
      estimated: this.dollars(r.estimated),
      confirmed: this.dollars(r.confirmed),
    }));
  }

  protected exportForFunders(): void {
    this.dialogs.open<boolean, { period: string }, LearningBondExportDialog>(
      LearningBondExportDialog,
      { period: this.period },
    );
  }
}
