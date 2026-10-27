import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { PhIcon } from '../icon/icon';
import { ErrorSummaryItem } from './error-summary-item';

/** Error summary (design system: error-summary): every problem in a form, linked to its field, focused and centred in the viewport when it appears. */
@Component({
  selector: 'ph-error-summary',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'alert', tabindex: '-1' },
  templateUrl: './error-summary.html',
  styleUrl: './error-summary.scss',
})
export class PhErrorSummary {
  readonly items = input.required<ErrorSummaryItem[]>();
  readonly title = input<string | null>(null);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    // Focus without the browser's minimal scroll, then bring the summary to the middle of the viewport: scrolled only to the top
    // edge, the page header above it would sit half under the sticky top bar, hiding its actions (WCAG 2.4.11).
    afterNextRender(() => {
      host.nativeElement.focus({ preventScroll: true });
      host.nativeElement.scrollIntoView({ block: 'center' });
    });
  }

  protected heading(): string {
    const n = this.items().length;
    return this.title() ?? `Fix ${n === 1 ? 'this' : `these ${n} things`} first`;
  }
}
