import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhAvatar } from '../avatar/avatar';

/**
 * Quick Card (design system: quick-card): emergency information first. The head shows the child's avatar, name (the
 * page's h1) and a subtitle, with a status such as the sync chip projected as `[phQuickCardStatus]`; the blocks are projected.
 */
@Component({
  selector: 'ph-quick-card',
  imports: [PhAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quick-card.html',
  styleUrl: './quick-card.scss',
})
export class PhQuickCard {
  readonly name = input.required<string>();
  readonly subtitle = input('');
}
