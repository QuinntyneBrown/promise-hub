import type { BadgeKind } from './badge-kind';
import type { BadgeRule } from './badge-rule';

/** One badge in the Badges list (L2-084 criterion 1). */
export interface BadgeSummary {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  kind: BadgeKind;
  rule: BadgeRule | null;
  targetId: string | null;
  targetTitle: string | null;
  competencyId: string | null;
  competencyName: string | null;
  earnedCount: number;
}
