import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The progress board (mock: progress-board). */
export class ProgressBoardPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/reports/progress');
    await this.expectOpen();
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Progress board' })).toBeVisible();
  }

  get board(): Locator {
    return this.page.getByRole('table', { name: /^Progress board/ });
  }

  /** The cells of a youth's row after the name, as read. */
  async row(name: string): Promise<string[]> {
    const row = this.board.locator('tbody tr').filter({ hasText: name });
    return (await row.getByRole('cell').allTextContents()).map((t) => t.trim()).slice(1);
  }

  async average(): Promise<string[]> {
    return (await this.board.locator('tfoot tr').locator('th, td').allTextContents()).map((t) => t.trim());
  }

  async chooseCohort(name: string): Promise<void> {
    await this.page.getByLabel('Cohort', { exact: true }).selectOption({ label: name });
  }

  get noTrack(): Locator {
    return this.page.getByRole('heading', { name: 'This cohort follows no track' });
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'No youth in this cohort yet' });
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load the progress board' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Reports are for directors and site leads' });
  }
}
