import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Bulk action bar (design system: bulk-action-bar): how many rows are selected and what can be done to all of them (projected buttons). */
@Component({
  selector: 'ph-bulk-action-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'region', '[attr.aria-label]': 'label()' },
  templateUrl: './bulk-action-bar.html',
  styleUrl: './bulk-action-bar.scss',
})
export class PhBulkActionBar {
  readonly count = input.required<number>();
  readonly label = input('Selected items');
}
