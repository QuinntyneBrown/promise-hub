import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PhButton } from '../button/button';

/**
 * Pagination (design system: pagination): Previous, the numbered pages with the current one marked, Next, and the range shown
 * ("Showing 26–40 of 40") as a polite status. The page owns the data; this emits the page asked for.
 */
@Component({
  selector: 'ph-pagination',
  imports: [PhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class PhPagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  /** The navigation landmark's name. */
  readonly label = input('Pagination');
  /** Numbered page buttons between Previous and Next (the numbered variant). */
  readonly numbered = input(true);
  readonly pageChange = output<number>();

  protected readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly numbers = computed(() =>
    Array.from({ length: this.pages() }, (_, i) => i + 1),
  );
  protected readonly range = computed(() => {
    const total = this.total();
    if (total === 0) return 'Showing 0 of 0';
    const from = Math.min((this.page() - 1) * this.pageSize() + 1, total);
    const to = Math.min(this.page() * this.pageSize(), total);
    return `Showing ${from}–${to} of ${total.toLocaleString('en-US')}`;
  });

  protected go(page: number): void {
    if (page >= 1 && page <= this.pages() && page !== this.page()) this.pageChange.emit(page);
  }
}
