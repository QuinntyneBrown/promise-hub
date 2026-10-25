import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TabLink } from './tab-link';

/** Tabs (design system: tabs) as section navigation: links, the current one marked aria-current="page". */
@Component({
  selector: 'ph-tabs',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
})
export class PhTabs {
  readonly label = input.required<string>();
  readonly links = input.required<TabLink[]>();
}
