import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Search (mock: search): the query field and results grouped by children, families and events. */
export class SearchPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Search' });
  }

  get field(): Locator {
    return this.page.getByRole('main').getByRole('searchbox', { name: 'Search children, families and events' });
  }

  get status(): Locator {
    return this.page.getByRole('main').getByRole('status');
  }

  async searchFor(q: string): Promise<void> {
    await this.field.fill(q);
  }

  /** The top bar's search where it is shown (desktop); on a phone, the Search page's own field. */
  async fromTopBar(q: string): Promise<void> {
    const box = this.page.getByRole('banner').getByRole('searchbox');
    if (!(await box.isVisible())) {
      await this.open();
      await this.searchFor(q);
      return;
    }
    await box.fill(q);
    await box.press('Enter');
    await expect(this.heading).toBeVisible();
  }

  group(name: 'Children' | 'Families' | 'Events'): Locator {
    return this.page.getByRole('list', { name });
  }

  async names(group: 'Children' | 'Families' | 'Events'): Promise<string[]> {
    return (await this.group(group).getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  emptyHeading(text: string): Locator {
    return this.page.getByRole('heading', { name: text });
  }

  async open(q = ''): Promise<void> {
    await super.open(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    await expect(this.heading).toBeVisible();
  }
}
