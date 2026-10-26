import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Mentoring, the mentor's assigned youth (mock: mentoring). */
export class MentoringPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/mentoring');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Mentoring' })).toBeVisible();
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: 'No youth assigned yet' });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(async () => (await fetch('/api/mentoring/youth')).status);
  }
}
