import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A volunteer's schedule (mock: my-schedule): the sessions he is assigned to in the next four weeks, by day. */
export class MySchedulePage extends BasePage {
  async open(): Promise<void> {
    await super.open('/my-schedule');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** The day headings, in order. */
  async days(): Promise<string[]> {
    return (await this.page.getByTestId('schedule-day').allTextContents()).map((t) => t.trim());
  }

  /** A session's row, by its name and day heading ("Saturday 7 November"). */
  session(name: string, day: string): Locator {
    return this.page
      .getByRole('region', { name: day })
      .getByRole('listitem')
      .filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async takeAttendance(name: string, day: string): Promise<void> {
    await this.session(name, day).getByRole('link', { name: /Take attendance/ }).click();
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'No sessions scheduled' });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load your schedule' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'This schedule is for people who run sessions' });
  }

  async tryAgain(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }
}
