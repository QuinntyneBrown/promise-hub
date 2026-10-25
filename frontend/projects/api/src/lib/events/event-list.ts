import type { EventSummary } from './event-summary';

export interface EventList {
  events: EventSummary[];
  upcoming: number;
  needSlips: number;
}
