import type { EarnedBadge } from './earned-badge';
import type { LockedBadge } from './locked-badge';
import type { Milestone } from './milestone';

/** A youth's badges (L2-087 criteria 4 and 5): earned oldest first, those she can still earn, and her milestones. */
export interface LearnerBadges {
  earned: EarnedBadge[];
  locked: LockedBadge[];
  milestones: Milestone[];
}
