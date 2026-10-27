import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Code sample (design system: code-sample): a read-only, scrollable example of code, named for screen readers and focusable to scroll. */
@Component({
  selector: 'ph-code-sample',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './code-sample.html',
  styleUrl: './code-sample.scss',
})
export class PhCodeSample {
  readonly code = input.required<string>();
  /** The accessible name, such as “Example: Every page has a skeleton”. */
  readonly label = input.required<string>();
}
