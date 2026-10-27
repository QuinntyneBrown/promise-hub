import type { BadgeSummary } from './badge-summary';

/** The organization's badges, how many awards there are and how many youth hold one. */
export interface BadgeList {
  badges: BadgeSummary[];
  awards: number;
  youth: number;
}
