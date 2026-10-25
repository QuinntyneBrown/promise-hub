import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * List row (design system: list): a title, a line of meta, an optional caption and error,
 * and trailing content such as a switch. `muted` dims the title, as for a module that is off.
 */
@Component({
  selector: 'ph-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'listitem', '[class.muted]': 'muted()' },
  templateUrl: './list-item.html',
  styleUrl: './list-item.scss',
})
export class PhListItem {
  readonly title = input.required<string>();
  readonly meta = input<string | null>(null);
  readonly caption = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly muted = input(false);
}
