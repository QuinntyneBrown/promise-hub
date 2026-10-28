import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A youth's schedule (mock: youth-schedule): her sessions in the next four weeks by day, with her answers. */
export class YouthSchedulePage extends BasePage {
  async open(): Promise<void> {
    await super.open('/schedule');
    await expect(this.heading).toHaveText('Your schedule');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** The day headings, in order. */
  async days(): Promise<string[]> {
    return (await this.page.getByTestId('schedule-day').allTextContents()).map((t) => t.trim());
  }

  /** The session names, in order. */
  async sessions(): Promise<string[]> {
    return (await this.page.getByRole('main').getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  /** A session's row, by its name and day heading ("Saturday 14 November"). */
  session(name: string, day: string): Locator {
    return this.page
      .getByRole('region', { name: day })
      .getByRole('listitem')
      .filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async rsvp(name: string, day: string): Promise<void> {
    await this.session(name, day)
      .getByRole('button', { name: /RSVP/ })
      .click();
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'Nothing scheduled in the next four weeks' });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load your schedule' });
  }

  get consentRequired(): Locator {
    return this.page.getByRole('heading', { name: 'A guardian needs to agree first' });
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  async retry(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }

  async apiStatus(path = '/api/schedule'): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }

  async rsvpStatus(eventId: string, body: Record<string, unknown>): Promise<number> {
    return this.page.evaluate(
      async ({ id, b }) => (await fetch(`/api/schedule/${id}/rsvp`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })).status,
      { id: eventId, b: body },
    );
  }
}
