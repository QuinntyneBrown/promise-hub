import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PhIcon } from '../icon/icon';
import { NavItem } from '../navigation/nav-item';

/** Bottom navigation (design system: bottom-navigation): the phone tab bar, hidden from 768px. Ends with More. */
@Component({
  selector: 'ph-bottom-navigation',
  imports: [RouterLink, RouterLinkActive, PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bottom-navigation.html',
  styleUrl: './bottom-navigation.scss',
})
export class PhBottomNavigation {
  readonly items = input.required<NavItem[]>();
  readonly homeLink = input('/');
  readonly menuOpen = input(false);
  readonly moreRequested = output<void>();
  protected readonly tabs = computed(() => this.items().filter((item) => item.tab));
}
