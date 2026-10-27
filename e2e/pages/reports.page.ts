import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Reports (mock: reports) and the export dialog (mock: export-data). */
export class ReportsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/reports');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Reports' })).toBeVisible();
  }

  stat(label: string): Locator {
    return this.page.getByRole('region', { name: 'Headline numbers' }).getByText(label).locator('..').getByTestId('stat-value');
  }

  get ages(): Locator {
    return this.page.getByRole('table', { name: 'Children by age' });
  }

  ageCount(band: string): Locator {
    return this.ages.getByRole('row').filter({ hasText: band }).getByRole('cell').last();
  }

  get maskNote(): Locator {
    return this.page.getByText('Counts under 5 show as “<5”.');
  }

  programRate(name: string): Locator {
    return this.page.getByRole('progressbar', { name: new RegExp(`^${name}`) });
  }

  async filterProgram(name: string): Promise<void> {
    await this.page.getByLabel('Program', { exact: true }).selectOption({ label: name });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async exportCsv(): Promise<void> {
    await this.page.getByRole('button', { name: 'Export' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('button', { name: 'Export CSV' }).click();
  }

  get download(): Locator {
    return this.dialog.getByRole('link', { name: /^Download/ });
  }

  async sendSurvey(eventName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Send a survey' }).click();
    await expect(this.dialog).toBeVisible();
    const select = this.dialog.getByLabel('Event');
    const value = await select.locator('option', { hasText: `${eventName} · ` }).first().getAttribute('value');
    await select.selectOption(value!);
    await this.dialog.getByRole('button', { name: 'Send survey' }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Reports are for directors and site leads' });
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t build the report' });
  }
}
