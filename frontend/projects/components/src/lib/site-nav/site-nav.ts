import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PhBrandMark } from '../brand-mark/brand-mark';
import { PhButton } from '../button/button';
import { SiteLink } from './site-link';

/**
 * Site nav (design system: site-nav): the public website's top frame. The organization's name links home, the public pages follow with
 * the current one marked, and Sign in and Apply sit at the end. Below 768px the links wrap onto their own row; nothing hides behind a menu.
 */
@Component({
  selector: 'ph-site-nav',
  imports: [RouterLink, RouterLinkActive, PhBrandMark, PhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-nav.html',
  styleUrl: './site-nav.scss',
})
export class PhSiteNav {
  readonly organization = input.required<string>();
  readonly home = input.required<string | unknown[]>();
  readonly links = input.required<SiteLink[]>();
  readonly signIn = input<string | unknown[] | null>(null);
  readonly apply = input<string | unknown[] | null>(null);
}
