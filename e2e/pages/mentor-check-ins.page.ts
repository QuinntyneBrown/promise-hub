import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Mentor check-ins, the mentor’s history (mock: mentor-check-in-history). */
export class MentorCheckInsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/mentoring/check-ins');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Mentor check-ins' })).toBeVisible();
  }

  get items(): Locator {
    return this.page.getByRole('list', { name: 'Mentor check-ins, newest first' }).getByRole('listitem');
  }

  async logCheckIn(): Promise<void> {
    await this.page.getByRole('button', { name: 'Log a mentor check-in' }).first().click();
  }

  async filterYouth(name: string): Promise<void> {
    await this.page.getByLabel('Youth', { exact: true }).selectOption({ label: name });
  }

  async filterType(name: string): Promise<void> {
    await this.page.getByLabel('Type', { exact: true }).selectOption({ label: name });
  }

  async clearFilters(): Promise<void> {
    await this.page.getByRole('button', { name: 'Clear filters' }).click();
  }

  get noResults(): Locator {
    return this.page.getByRole('heading', { name: 'No mentor check-ins match' });
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'No mentor check-ins yet' });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load your mentor check-ins' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Mentoring is for mentors' });
  }

  async retry(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }

  toast(text: string): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(async () => (await fetch('/api/mentoring/check-ins')).status);
  }
}
