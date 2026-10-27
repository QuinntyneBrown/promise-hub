import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** My youth, every youth assigned to the mentor (mock: mentor-youth). */
export class MentorYouthPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/mentoring/youth');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'My youth' })).toBeVisible();
  }

  get youth(): Locator {
    return this.page.getByRole('list', { name: 'Your youth' }).getByTestId('list-title');
  }

  row(name: string): Locator {
    return this.page.getByRole('list', { name: 'Your youth' }).getByRole('listitem').filter({ hasText: name });
  }

  async search(text: string): Promise<void> {
    await this.page.getByRole('searchbox', { name: 'Search your youth' }).fill(text);
  }

  get noResults(): Locator {
    return this.page.getByRole('heading', { name: /^No youth match/ });
  }

  async clearSearch(): Promise<void> {
    await this.page.getByRole('button', { name: 'Clear search' }).click();
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: 'No youth assigned yet' });
  }

  async openYouth(name: string): Promise<void> {
    await this.page.getByRole('list', { name: 'Your youth' }).getByRole('link', { name: new RegExp(`^${name}`) }).click();
  }
}
