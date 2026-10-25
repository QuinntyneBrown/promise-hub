import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PhAvatar } from '../avatar/avatar';
import { PhIcon } from '../icon/icon';
import { NavDrawerData } from './nav-drawer-data';

/**
 * Drawer (design system: drawer, "Main menu"): every section the person may open, sliding in
 * from the start edge. Open it with `openNavDrawer`; CDK Dialog traps focus and closes on Escape.
 */
@Component({
  selector: 'ph-nav-drawer',
  imports: [RouterLink, RouterLinkActive, PhAvatar, PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'nav-drawer' },
  templateUrl: './nav-drawer.html',
  styleUrl: './nav-drawer.scss',
})
export class PhNavDrawer {
  protected readonly data = inject<NavDrawerData>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);
}
