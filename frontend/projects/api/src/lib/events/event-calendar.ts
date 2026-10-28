import type { CalendarEvent } from './calendar-event';

/** A month of events (yyyy-MM), the organization's today (yyyy-mm-dd) and the month's events, soonest first. */
export interface EventCalendar {
  month: string;
  today: string;
  events: CalendarEvent[];
}
