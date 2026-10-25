import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** List (design system: list). On its own it is a flush card; `inset` drops the card for a list inside a ph-card. */
@Component({
  selector: 'ph-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.inset]': 'inset()' },
  templateUrl: './list.html',
  styleUrl: './list.scss',
})
export class PhList {
  readonly label = input.required<string>();
  readonly inset = input(false);
}
