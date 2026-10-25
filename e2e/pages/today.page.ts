import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Today, the staff home. This slice has only its empty state. */
export class TodayPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/');
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: 'Nothing here yet' });
  }

  session(name: string): Locator {
    return this.page.getByRole('region', { name });
  }

  emptyStateAction(name: string): Locator {
    return this.page.getByRole('link', { name });
  }
}
