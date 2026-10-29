import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let next = 0;

/** A labelled section of a public page (mocks: site-*): a small overline, the heading and its content in a wrapping grid when asked. */
@Component({
  selector: 'ph-site-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-section.html',
  styleUrl: './site-section.css',
})
export class SiteSection {
  readonly eyebrow = input.required<string>();
  readonly heading = input.required<string>();
  readonly lead = input<string | null>(null);
  /** Lay the content out as a grid of cards that wraps to one column on a phone. */
  readonly grid = input(false);
  protected readonly id = `site-section-${++next}`;
}
