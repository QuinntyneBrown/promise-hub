import type { JourneyBadge } from './journey-badge';

/** The journey's badge strip: earned of the badges she can earn, earned first. */
export interface JourneyBadges {
  earned: number;
  total: number;
  items: JourneyBadge[];
}
