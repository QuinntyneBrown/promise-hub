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

/** Error summary (design system: error-summary): every problem in a form, linked to its field, focused when it appears. */
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
    afterNextRender(() => host.nativeElement.focus());
  }

  protected heading(): string {
    const n = this.items().length;
    return this.title() ?? `Fix ${n === 1 ? 'this' : `these ${n} things`} first`;
  }
}
