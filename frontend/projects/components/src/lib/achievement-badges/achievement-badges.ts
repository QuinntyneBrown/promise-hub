import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhAchievementBadge } from '../achievement-badge/achievement-badge';
import { achievementIcon } from '../achievement-badge/achievement-icon';
import type { AchievementBadgeItem } from './achievement-badge-item';

/**
 * Achievement badge collection (design system: achievement-badge, collection): several badges as a labelled list that wraps from one
 * column on a phone; each locked badge says so in its caption.
 */
@Component({
  selector: 'ph-achievement-badges',
  imports: [PhAchievementBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './achievement-badges.html',
  styleUrl: './achievement-badges.scss',
})
export class PhAchievementBadges {
  readonly label = input.required<string>();
  readonly badges = input.required<AchievementBadgeItem[]>();
  protected readonly icon = achievementIcon;
}
