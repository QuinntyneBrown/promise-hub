import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhIcon } from '../icon/icon';

/** Quick Card alert (design system: quick-card): the severe-allergy block that always comes first. */
@Component({
  selector: 'ph-quick-card-alert',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'note', 'aria-label': 'Allergy alert' },
  templateUrl: './quick-card-alert.html',
  styleUrl: './quick-card-alert.scss',
})
export class PhQuickCardAlert {
  readonly title = input.required<string>();
  readonly instruction = input<string | null>(null);
}
