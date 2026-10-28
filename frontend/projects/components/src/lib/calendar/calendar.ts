import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { CalendarDay } from './calendar-day';
import type { CalendarEntry } from './calendar-entry';

const WEEKDAYS = [
  { short: 'Mon', long: 'Monday' },
  { short: 'Tue', long: 'Tuesday' },
  { short: 'Wed', long: 'Wednesday' },
  { short: 'Thu', long: 'Thursday' },
  { short: 'Fri', long: 'Friday' },
  { short: 'Sat', long: 'Saturday' },
  { short: 'Sun', long: 'Sunday' },
];
const MONTHS = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' });
const SHORT_MONTHS = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Calendar (design system: calendar): a month of entries by week, Monday first, as a captioned table; each day lists its entries as links
 * with their time, today is marked with aria-current="date", days of the neighbouring months are muted, and a cancelled entry says so in
 * words. Below 640px it is an agenda of only the days with entries. Days are calendar dates (yyyy-mm-dd), so no time zone is involved.
 */
@Component({
  selector: 'ph-calendar',
  imports: [NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.html',
  styleUrl: './calendar.scss',
})
export class PhCalendar {
  /** The month shown, yyyy-MM. */
  readonly month = input.required<string>();
  /** Today's date, yyyy-mm-dd, or null. */
  readonly today = input<string | null>(null);
  readonly entries = input<CalendarEntry[]>([]);

  protected readonly weekdays = WEEKDAYS;

  private readonly first = computed(() => {
    const [y, m] = this.month().split('-').map(Number);
    return new Date(Date.UTC(y!, m! - 1, 1));
  });

  /** "November 2026", the table's caption. */
  protected readonly label = computed(
    () => `${MONTHS.format(this.first())} ${this.first().getUTCFullYear()}`,
  );

  protected readonly weeks = computed<CalendarDay[][]>(() => {
    const first = this.first();
    const month = first.getUTCMonth();
    const byDay = new Map<string, CalendarEntry[]>();
    for (const e of this.entries()) byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);
    const start = new Date(first);
    start.setUTCDate(1 - ((first.getUTCDay() + 6) % 7));
    const weeks: CalendarDay[][] = [];
    for (let d = new Date(start); weeks.length === 0 || d.getUTCMonth() === month;) {
      const week: CalendarDay[] = [];
      for (let i = 0; i < 7; i++, d.setUTCDate(d.getUTCDate() + 1)) {
        const date = iso(d);
        const outside = d.getUTCMonth() !== month;
        week.push({
          date,
          number: d.getUTCDate(),
          weekday: WEEKDAYS[i]!.long,
          outside,
          today: date === this.today(),
          entries: outside ? [] : (byDay.get(date) ?? []),
        });
      }
      weeks.push(week);
    }
    return weeks;
  });

  /** The days of the month that have entries, for the phone agenda. */
  protected readonly agenda = computed(() =>
    this.weeks()
      .flat()
      .filter((d) => !d.outside && d.entries.length > 0),
  );

  protected short(day: CalendarDay): string {
    const d = new Date(`${day.date}T12:00:00Z`);
    return `${day.weekday.slice(0, 3)} ${day.number} ${SHORT_MONTHS.format(d)}`;
  }
}
