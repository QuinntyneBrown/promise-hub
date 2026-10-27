import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Scripture block (design system: scripture-block): a quoted passage set apart from the teaching, with an optional reference. */
@Component({
  selector: 'ph-scripture-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scripture-block.html',
  styleUrl: './scripture-block.scss',
})
export class PhScriptureBlock {
  readonly text = input.required<string>();
  /** Where the passage comes from, such as “Mark 10:45”. */
  readonly reference = input<string | null>(null);
  /** The reading size step of the lesson. */
  readonly size = input<'md' | 'lg' | 'xl'>('md');
}
