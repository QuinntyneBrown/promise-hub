import type { BadgeAward } from './badge-award';
import type { BadgeSummary } from './badge-summary';
import type { BadgeYouth } from './badge-youth';

/** One badge for the builder (L2-084, L2-085 criterion 4): who holds it and who can still be awarded it. */
export interface BadgeDetail extends Omit<BadgeSummary, 'earnedCount'> {
  awards: BadgeAward[];
  youth: BadgeYouth[];
}
