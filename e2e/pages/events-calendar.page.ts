import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The events calendar (mock: events-calendar): a month by week on a laptop, an agenda of days on a phone. */
export class EventsCalendarPage extends BasePage {
  async open(month = ''): Promise<void> {
    await super.open(`/events/calendar${month ? `?month=${month}` : ''}`);
    await expect(this.heading).toHaveText('Calendar');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get month(): Locator {
    return this.page.getByRole('group', { name: 'Month' }).getByRole('heading');
  }

  /** The visible calendar: the month table on a laptop, the agenda list on a phone. */
  get calendar(): Locator {
    return this.page.getByRole('table').or(this.page.getByRole('list', { name: /days with sessions$/ }));
  }

  get today(): Locator {
    return this.page.locator('[aria-current="date"]');
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: /^Nothing scheduled in / });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load the calendar' });
  }

  /** The session links shown, in the order they appear. */
  async entries(): Promise<string[]> {
    return (await this.calendar.getByRole('link').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  }

  entry(name: string): Locator {
    return this.calendar.getByRole('link', { name: new RegExp(name) }).first();
  }

  async previous(): Promise<void> {
    await this.page.getByRole('button', { name: 'Previous month' }).click();
  }

  async next(): Promise<void> {
    await this.page.getByRole('button', { name: 'Next month' }).click();
  }

  async thisMonth(): Promise<void> {
    await this.page.getByRole('button', { name: 'This month' }).click();
  }

  async program(label: string): Promise<void> {
    await this.page.getByLabel('Program').selectOption({ label });
  }

  async retry(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }

  async apiStatus(path = '/api/events/calendar?month=2026-11'): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }
}
