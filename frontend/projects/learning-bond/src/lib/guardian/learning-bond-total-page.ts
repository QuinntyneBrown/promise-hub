import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { GuardianPageResult, LEARNING_BOND_API, LearningBondTotal } from '@promisehub/api';
import {
  PhButton,
  PhCard,
  PhEmptyState,
  PhGuardianShell,
  PhSkeleton,
  PhStat,
  PhTable,
  TableCell,
  TableColumn,
} from '@promisehub/components';
import { guardianBenefitsText } from './guardian-benefits-text';
import { guardianLearningBondText } from './guardian-learning-bond-text';

/** The running total (learning-bond-total, L2-158): unlocked so far, applied for, and both by child and stream; the household's own. */
@Component({
  selector: 'ph-learning-bond-total-page',
  imports: [PhButton, PhCard, PhEmptyState, PhGuardianShell, PhSkeleton, PhStat, PhTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-total-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondTotalPage implements OnInit {
  protected readonly api = inject(LEARNING_BOND_API);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<LearningBondTotal> | null>(null);
  protected readonly language = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.language : r?.status === 'verify' ? r.language : 'en';
  });
  protected readonly text = computed(() => guardianLearningBondText(this.language()));
  protected readonly words = computed(() => guardianBenefitsText(this.language()));
  protected readonly organization = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value.organization;
    return r?.status === 'verify' || r?.status === 'gone' ? r.organization : null;
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.total(this.token()).subscribe((r) => this.result.set(r));
  }

  protected readonly columns = computed<TableColumn[]>(() => {
    const b = this.words();
    return [
      { key: 'child', label: b.childColumn },
      { key: 'stream', label: b.streamColumn },
      { key: 'confirmed', label: b.confirmedColumn, numeric: true },
      { key: 'applied', label: b.appliedColumn, numeric: true },
    ];
  });

  /** One row per child and stream: what is confirmed and what is applied for. */
  protected rows(total: LearningBondTotal): Record<string, TableCell>[] {
    const b = this.words();
    const money = (n: number) => this.text().amount(n);
    const keys = [...new Set(total.lines.map((l) => `${l.child ?? ''}|${l.stream}`))];
    return keys.map((key) => {
      const [child, stream] = key.split('|') as [string, string];
      const lines = total.lines.filter((l) => (l.child ?? '') === child && l.stream === stream);
      const confirmed = lines.filter((l) => l.confirmed).reduce((s, l) => s + l.amount, 0);
      const applied = lines.filter((l) => !l.confirmed).reduce((s, l) => s + l.amount, 0);
      return {
        child: child || b.family,
        stream,
        confirmed: confirmed ? money(confirmed) : '—',
        applied: applied ? b.upTo(money(applied)) : '—',
      };
    });
  }
}
