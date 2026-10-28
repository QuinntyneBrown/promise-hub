/** A session on the calendar: its calendar day (yyyy-mm-dd), its time as shown, its label and where it links. */
export interface CalendarEntry {
  key: string;
  day: string;
  time: string;
  label: string;
  link: string | unknown[];
  cancelled: boolean;
}
