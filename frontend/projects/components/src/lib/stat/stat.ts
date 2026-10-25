import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Stat (design system: stat): a label, a value and an optional caption, on a card. */
@Component({
  selector: 'ph-stat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat.html',
  styleUrl: './stat.scss',
})
export class PhStat {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly caption = input<string | null>(null);
}
