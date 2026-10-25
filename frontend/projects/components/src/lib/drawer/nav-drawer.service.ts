import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { Injectable, inject } from '@angular/core';
import { PhNavDrawer } from './nav-drawer';
import { NavDrawerData } from './nav-drawer-data';

/** Opens the main-menu drawer as a modal pinned to the start edge, labelled "Menu". */
@Injectable({ providedIn: 'root' })
export class NavDrawerService {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);

  open(data: NavDrawerData): DialogRef<unknown, PhNavDrawer> {
    return this.dialog.open(PhNavDrawer, {
      data,
      ariaLabelledBy: 'menu-title',
      ariaModal: true,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      positionStrategy: this.overlay.position().global().left('0').top('0'),
      backdropClass: 'ph-backdrop',
    });
  }
}
