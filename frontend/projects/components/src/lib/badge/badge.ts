import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Badge (design system: badge): a status word in a tone, such as "Primary" or "Missing info". */
@Component({
  selector: 'ph-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"badge badge--" + tone()' },
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class PhBadge {
  readonly tone = input<'neutral' | 'info' | 'success' | 'warning'>('neutral');
}
