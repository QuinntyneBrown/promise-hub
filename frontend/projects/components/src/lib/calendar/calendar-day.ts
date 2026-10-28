import type { CalendarEntry } from './calendar-entry';

/** A day cell of the month grid: its date, whether it belongs to the month shown, whether it is today, and its entries. */
export interface CalendarDay {
  date: string;
  number: number;
  weekday: string;
  outside: boolean;
  today: boolean;
  entries: CalendarEntry[];
}
