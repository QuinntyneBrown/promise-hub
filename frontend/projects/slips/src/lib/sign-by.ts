const day = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

/** "Thu 12 Nov" for a sign-by date. */
export function formatSignBy(date: string): string {
  return day.format(new Date(`${date}T12:00:00Z`)).replace(',', '');
}
