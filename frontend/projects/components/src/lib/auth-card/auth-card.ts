import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhBrandMark } from '../brand-mark/brand-mark';

/** Authentication card (design system: authentication-card): the centred card of sign-in and recovery pages. */
@Component({
  selector: 'ph-auth-card',
  imports: [PhBrandMark],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-card.html',
  styleUrl: './auth-card.scss',
})
export class PhAuthCard {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
}
