import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
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
import type { OrgOption } from './org-option';

@Component({
  selector: 'ph-top-bar',
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkMenuItemRadio,
    CdkMenuTrigger,
    FormsModule,
    RouterLink,
    RouterLinkActive,
    PhAvatar,
    PhBrandMark,
    PhIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.scss',
})
export class PhTopBar {
  readonly items = input.required<NavItem[]>();
  readonly homeLink = input('/');
  readonly personName = input.required<string>();
  /** "Site lead · Harbourview Youth Collective", shown at the top of the account menu. */
  readonly personContext = input('');
  readonly avatarTint = input<AvatarTint>('sky');
  readonly unread = input(0);
  readonly menuOpen = input(false);
  /** The person's organizations; the switcher shows only when there are two or more (L2-002). */
  readonly organizations = input<OrgOption[]>([]);

  readonly moreRequested = output<void>();
  readonly signOutRequested = output<void>();
  readonly notificationsRequested = output<void>();
  readonly searched = output<string>();
  readonly organizationChosen = output<string>();

  protected readonly activeOrganization = computed(
    () => this.organizations().find((o) => o.active) ?? null,
  );

  protected query = '';
}
