import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';

/** Opens a dialog component: a sheet from the bottom on phones, centred from 640px. Focus is trapped and Escape closes it. */
@Injectable({ providedIn: 'root' })
export class PhDialogs {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);

  open<R, D, C>(component: ComponentType<C>, data?: D): DialogRef<R, C> {
    const phone = typeof matchMedia === 'function' && !matchMedia('(min-width: 40rem)').matches;
    const position = this.overlay.position().global().centerHorizontally();
    return this.dialog.open<R, D, C>(component, {
      data,
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      backdropClass: 'ph-backdrop',
      positionStrategy: phone ? position.bottom('0') : position.centerVertically(),
    });
  }
}
