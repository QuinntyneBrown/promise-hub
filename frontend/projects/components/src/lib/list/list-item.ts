import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PhAvatar } from '../avatar/avatar';
import { AvatarTint } from '../avatar/avatar-tint';

/**
 * List row (design system: list): an optional avatar, a title, a line of meta, an optional paragraph of
 * text, an optional caption and error, and trailing content (projected) such as a switch, badge or button. With `link` the
 * avatar and text are one link. `muted` dims the title, as for a module that is off.
 */
@Component({
  selector: 'ph-list-item',
  imports: [NgTemplateOutlet, RouterLink, PhAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'listitem', '[class.muted]': 'muted()' },
  templateUrl: './list-item.html',
  styleUrl: './list-item.scss',
})
export class PhListItem {
  readonly title = input.required<string>();
  readonly meta = input<string | null>(null);
  readonly caption = input<string | null>(null);
  /** A paragraph under the meta (design system: list, text variant), as for a youth's shared reflection. */
  readonly text = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly muted = input(false);
  readonly link = input<string | unknown[] | null>(null);
  readonly avatar = input<string | null>(null);
  readonly avatarTint = input<AvatarTint>('accent');
}
