import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Skip link (design system: skip-link): the first focusable element; moves focus to the main landmark. */
@Component({
  selector: 'ph-skip-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skip-link.html',
  styleUrl: './skip-link.scss',
})
export class PhSkipLink {
  readonly target = input('main');

  protected skip(event: Event): void {
    // The router would treat the fragment as navigation; move focus directly instead.
    event.preventDefault();
    const main = document.getElementById(this.target());
    main?.setAttribute('tabindex', '-1');
    main?.focus();
  }
}
