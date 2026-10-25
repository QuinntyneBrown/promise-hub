import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PhIcon } from '../icon/icon';
import { ToastService } from './toast.service';

/** Toast region (design system: toast): a polite live region, above the phone tab bar. Place once in the app root. */
@Component({
  selector: 'ph-toast-region',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-region.html',
  styleUrl: './toast-region.scss',
})
export class PhToastRegion {
  protected readonly toasts = inject(ToastService);
}
