import type { BadgeRule } from '../curriculum/badge-rule';

/** A badge the youth can still earn: what earns it and how far she is; `total` is null for a badge awarded by hand. */
export interface LockedBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  kind: 'Automatic' | 'Manual';
  rule: BadgeRule | null;
  completed: number | null;
  total: number | null;
}
