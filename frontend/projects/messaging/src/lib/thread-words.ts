import { formatDay, formatTime } from '@promisehub/components';

/** The first name of a person, for a message's meta ("Sofía · 3:58 pm"). */
export function firstName(name: string): string {
  return name.split(' ')[0] ?? name;
}

/** "Today", "Yesterday" or "Wed 4 Nov" for a moment, in the viewer's time zone, relative to now. */
export function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const key = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (key(d) === key(now)) return 'Today';
  if (key(d) === key(yesterday)) return 'Yesterday';
  return formatDay(iso);
}

/** "3:58 pm". */
export function timeLabel(iso: string): string {
  return formatTime(new Date(iso));
}
