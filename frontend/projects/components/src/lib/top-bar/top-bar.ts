import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PhAvatar } from '../avatar/avatar';
import { AvatarTint } from '../avatar/avatar-tint';
import { PhBrandMark } from '../brand-mark/brand-mark';
import { PhIcon } from '../icon/icon';
import { NavItem } from '../navigation/nav-item';

/**
 * Top bar (design system: top-bar): the floating capsule. Brand, primary navigation, More,
 * search (from 1280px), notifications and the account button. It never shows the organization
 * inline and never overflows: `wide` items wait for 1024px and `overflow` items live in More.
 */
@Component({
  selector: 'ph-top-bar',
  imports: [FormsModule, RouterLink, RouterLinkActive, PhAvatar, PhBrandMark, PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
})
export class PhTopBar {
  readonly items = input.required<NavItem[]>();
  readonly homeLink = input('/');
  readonly personName = input.required<string>();
  readonly avatarTint = input<AvatarTint>('sky');
  readonly unread = input(0);
  readonly menuOpen = input(false);

  readonly moreRequested = output<void>();
  readonly accountRequested = output<void>();
  readonly notificationsRequested = output<void>();
  readonly searched = output<string>();

  protected query = '';
}
