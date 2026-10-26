import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Learning, the youth's lessons (mock: learning). */
export class LearningPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/learning');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Learning' })).toBeVisible();
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: 'No lessons yet' });
  }

  /** What the API answers this signed-in person for their own record. */
  async apiStatus(): Promise<number> {
    return this.page.evaluate(async () => (await fetch('/api/learning/me')).status);
  }
}
