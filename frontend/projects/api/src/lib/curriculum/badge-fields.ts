import type { BadgeKind } from './badge-kind';
import type { BadgeRule } from './badge-rule';

/** A badge as the builder saves it; rule and target only for an automatic badge. */
export interface BadgeFields {
  name: string;
  icon: string;
  description: string;
  kind: BadgeKind;
  rule: BadgeRule | null;
  targetId: string | null;
  competencyId: string | null;
}
