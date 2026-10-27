const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });
const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** "4:00 pm", as the mocks write times. */
export function formatTime(value: Date): string {
  return time.format(value).replace(/\s?([AP])M$/, (_, p: string) => ` ${p.toLowerCase()}m`);
}

/** "Sat 14 Nov, 9:00 am–3:00 pm" for an event, in the viewer's time zone. */
export function formatWhen(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${day.format(start)}, ${formatTime(start)}–${formatTime(end)}`
    : `${day.format(start)}, ${formatTime(start)} – ${day.format(end)}, ${formatTime(end)}`;
}

/** "Sep 2026–Jun 2027" for a program's season. */
export function formatSeason(startsOn: string, endsOn: string): string {
  const start = monthYear.format(new Date(`${startsOn}T12:00:00Z`));
  const end = monthYear.format(new Date(`${endsOn}T12:00:00Z`));
  return start === end ? start : `${start}–${end}`;
}

/** "Thu 19 Nov" for a date (yyyy-mm-dd) or a moment. */
export function formatDay(iso: string): string {
  return day.format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso)).replace(',', '');
}

/** "14 Nov 2026". */
export function formatDate(iso: string): string {
  return date.format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

/** The value of a datetime-local input for an instant, in the viewer's time zone. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The instant a datetime-local input means, or null when empty. */
export function fromLocalInput(value: string | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

/** "Fri 30 Oct, 2:14 pm" for a moment, in the viewer's time zone. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${day.format(d)}, ${formatTime(d)}`;
}
