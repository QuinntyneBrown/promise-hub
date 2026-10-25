import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhEmptyState } from '../empty-state/empty-state';
import { IconName } from '../icon/icon-name';

/** Error page (design system: error-page): a full-page empty state 48px down main, its title the page's h1. Actions are projected. */
@Component({
  selector: 'ph-error-page',
  imports: [PhEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
})
export class PhErrorPage {
  readonly icon = input.required<IconName>();
  readonly title = input.required<string>();
  readonly text = input.required<string>();
}
