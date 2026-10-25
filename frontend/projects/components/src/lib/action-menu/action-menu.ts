import { CdkMenu, CdkMenuItem } from '@angular/cdk/menu';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ActionMenuItem } from './action-menu-item';

/** Menu (design system: menu) shown in place, as in an actions dialog. Arrow keys move between items. */
@Component({
  selector: 'ph-action-menu',
  imports: [CdkMenu, CdkMenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './action-menu.html',
  styleUrl: './action-menu.scss',
})
export class PhActionMenu {
  readonly label = input.required<string>();
  readonly items = input.required<ActionMenuItem[]>();
  readonly selected = output<string>();
}
