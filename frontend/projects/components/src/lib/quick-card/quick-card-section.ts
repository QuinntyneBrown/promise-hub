import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

/** A titled Quick Card block (design system: quick-card section) with an overline heading, such as "Call, in this order". */
@Component({
  selector: 'ph-quick-card-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quick-card-section.html',
  styleUrl: './quick-card-section.scss',
})
export class PhQuickCardSection {
  readonly title = input.required<string>();
  protected readonly headingId = `ph-quick-card-section-${nextId++}`;
}
