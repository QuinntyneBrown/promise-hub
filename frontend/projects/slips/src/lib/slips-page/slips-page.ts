import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LoadResult, SLIPS_API, SlipRow } from '@promisehub/api';
import {
  PhBadge,
  PhCard,
  PhEmptyState,
  PhButton,
  PhPageHeader,
  PhProgressBar,
} from '@promisehub/components';
import { RouterLink } from '@angular/router';
import { formatSignBy } from '../sign-by';

/** Permission slips (mock: slips): every slip with its answers and deadline, soonest first. */
@Component({
  selector: 'ph-slips-page',
  imports: [RouterLink, PhBadge, PhButton, PhCard, PhEmptyState, PhPageHeader, PhProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slips-page.html',
  styleUrl: './slips-page.scss',
})
export class SlipsPage {
  private readonly api = inject(SLIPS_API);

  protected readonly result = signal<LoadResult<{ slips: SlipRow[] }> | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.list().subscribe((r) => this.result.set(r));
  }

  protected subtitle(slips: SlipRow[]): string {
    const open = slips.filter((s) => s.status === 'Sent');
    const unsigned = open.reduce((n, s) => n + s.children - s.signed, 0);
    return `${open.length} sent · ${unsigned} unsigned`;
  }

  protected meta(s: SlipRow): string {
    const status = s.status === 'Sent' ? 'sent' : s.status === 'Scheduled' ? 'scheduled' : 'draft';
    return [`Due ${formatSignBy(s.signBy)}`, s.programName, status].join(' · ');
  }

  protected badge(s: SlipRow): { label: string; tone: 'neutral' | 'success' | 'warning' } {
    if (s.status !== 'Sent')
      return { label: s.status === 'Scheduled' ? 'Scheduled' : 'Draft', tone: 'neutral' };
    const unsigned = s.children - s.signed;
    return unsigned
      ? { label: `${unsigned} unsigned`, tone: 'warning' }
      : { label: 'All signed', tone: 'success' };
  }
}
