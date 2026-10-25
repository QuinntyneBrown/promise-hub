const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** "14 Mar 2017" from "2017-03-14". */
export function formatDate(iso: string | null): string {
  return iso ? dateFormat.format(new Date(`${iso.slice(0, 10)}T12:00:00Z`)) : '';
}
