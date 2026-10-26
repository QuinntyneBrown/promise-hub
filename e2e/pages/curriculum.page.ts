import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Curriculum, where authors write tracks (mock: curriculum). */
export class CurriculumPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/curriculum');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Curriculum' })).toBeVisible();
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: 'No tracks yet' });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(async () => (await fetch('/api/curriculum')).status);
  }
}
