import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

/**
 * Card (design system: card): a raised surface. With a title it is a labelled region with an h2;
 * `flush` drops the padding for lists. A footer is projected with phCardFooter.
 */
@Component({
  selector: 'ph-card',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.card--flush]': 'flush()' },
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class PhCard {
  protected readonly id = `ph-card-${nextId++}`;
  readonly flush = input(false);
  readonly title = input<string | null>(null);
}
