import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Card (design system: card): a raised surface. `flush` drops the padding for lists and empty states. */
@Component({
  selector: 'ph-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.card--flush]': 'flush()' },
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class PhCard {
  readonly flush = input(false);
}
