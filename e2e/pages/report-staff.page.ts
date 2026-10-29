import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The staff activity report (mock: report-staff). */
export class StaffReportPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/reports/staff');
    await this.expectOpen();
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Staff activity' })).toBeVisible();
  }

  stat(label: string): Locator {
    return this.page.getByTestId(`stat-${label}`).getByTestId('stat-value');
  }

  mentorRow(name: string): Locator {
    return this.page.getByRole('table', { name: 'Mentor activity' }).getByRole('row').filter({ hasText: name });
  }

  get warning(): Locator {
    return this.page.getByText(/has \d+ youth$/);
  }

  async choosePeriod(label: string): Promise<void> {
    await this.page.getByLabel('Period', { exact: true }).selectOption({ label });
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'No mentors yet' });
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t build the staff report' });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async exportCsv(): Promise<void> {
    await this.page.getByRole('button', { name: 'Export CSV' }).click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('button', { name: 'Export CSV' }).click();
  }

  get download(): Locator {
    return this.dialog.getByRole('link', { name: /^Download/ });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Reports are for directors and site leads' });
  }
}
