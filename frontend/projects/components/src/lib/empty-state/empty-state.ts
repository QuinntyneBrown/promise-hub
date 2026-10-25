import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhIcon } from '../icon/icon';
import { IconName } from '../icon/icon-name';

/**
 * Empty state (design system: empty-state): icon, title, one line of text and up to two actions
 * (projected). `headingLevel` 1 when it is the page's only content, as on error pages.
 */
@Component({
  selector: 'ph-empty-state',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.empty--error]': 'tone() === "error"' },
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class PhEmptyState {
  readonly icon = input<IconName>('sparkle');
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly tone = input<'default' | 'error'>('default');
  readonly headingLevel = input<1 | 2>(2);
}
