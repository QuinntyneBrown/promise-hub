import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PhIcon } from '../icon/icon';
import { IconName } from '../icon/icon-name';

/**
 * Button (design system: button). Renders a link when `link` is set, otherwise a button.
 * Variants: default, primary, danger, ghost. Sizes: sm, md, lg. `iconOnly` needs `label`.
 */
@Component({
  selector: 'ph-button',
  imports: [NgTemplateOutlet, RouterLink, PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class PhButton {
  readonly variant = input<'default' | 'primary' | 'danger' | 'ghost'>('default');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly link = input<string | unknown[] | null>(null);
  /** A link outside the router, such as tel: or mailto:. */
  readonly href = input<string | null>(null);
  /** With `href`: `_blank` opens a new tab, safely (rel="noopener noreferrer"), such as a payment provider's checkout. */
  readonly target = input<'_blank' | null>(null);
  readonly type = input<'button' | 'submit'>('button');
  readonly icon = input<IconName | null>(null);
  readonly iconOnly = input(false);
  /** Full width; the label wraps instead of widening the page. */
  readonly block = input(false);
  readonly label = input<string | null>(null);
  readonly disabled = input(false);
  readonly busy = input(false);
  readonly current = input(false);
  readonly hasPopup = input<'dialog' | 'menu' | null>(null);
  readonly expanded = input<boolean | null>(null);

  protected classes(): string {
    return [
      'btn',
      this.variant() === 'default' ? '' : `btn--${this.variant()}`,
      this.size() === 'md' ? '' : `btn--${this.size()}`,
      this.iconOnly() ? 'btn--icon' : '',
      this.block() ? 'btn--block' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}
