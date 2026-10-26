import type { ChildHit } from './child-hit';
import type { EventHit } from './event-hit';
import type { HouseholdHit } from './household-hit';

/** Results grouped by type; events are null when Permission slips is off. */
export interface SearchResults {
  children: ChildHit[];
  households: HouseholdHit[];
  events: EventHit[] | null;
}
