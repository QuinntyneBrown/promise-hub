import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PhIcon } from '../icon/icon';
import { IconName } from '../icon/icon-name';

/**
 * Achievement badge (design system: achievement-badge): a badge youth earn, as a medal with its name and how it is earned. A locked
 * badge is muted and its caption says so in words. Without a name it is a decorative medal, such as the lead of a list row.
 */
@Component({
  selector: 'ph-achievement-badge',
  imports: [PhIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.locked]': 'locked()',
    '[class.small]': "size() === 'sm'",
    '[attr.aria-hidden]': "name() ? null : 'true'",
  },
  templateUrl: './achievement-badge.html',
  styleUrl: './achievement-badge.scss',
})
export class PhAchievementBadge {
  readonly icon = input.required<IconName>();
  readonly name = input<string | null>(null);
  /** How it is earned, or when it was; says “Locked” in words for a locked badge. */
  readonly caption = input<string | null>(null);
  readonly locked = input(false);
  readonly size = input<'md' | 'sm'>('md');
}
