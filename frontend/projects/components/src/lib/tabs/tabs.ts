import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TabItem } from './tab-item';
import { TabLink } from './tab-link';

/**
 * Tabs (design system: tabs): as section navigation, links with the current one marked aria-current="page"; as an
 * in-page tablist, buttons with arrow-key movement whose panels the page renders as role="tabpanel" labelled by "tab-{value}".
 */
@Component({
  selector: 'ph-tabs',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.html',
  styleUrl: './tabs.scss',
})
export class PhTabs {
  readonly label = input.required<string>();
  readonly links = input<TabLink[]>([]);
  readonly items = input<TabItem[]>([]);
  readonly selected = input<string | null>(null);
  readonly selectedChange = output<string>();

  protected move(event: KeyboardEvent, index: number): void {
    const items = this.items();
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % items.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + items.length) % items.length
          : -1;
    if (next < 0) return;
    event.preventDefault();
    this.selectedChange.emit(items[next]!.value);
    (event.currentTarget as HTMLElement).parentElement
      ?.querySelectorAll<HTMLElement>('[role="tab"]')
      [next]?.focus();
  }
}
