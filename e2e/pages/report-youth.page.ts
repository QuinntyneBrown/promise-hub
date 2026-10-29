import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The youth report (mock: report-youth). */
export class YouthReportPage extends BasePage {
  async openFor(childId: string, name: string): Promise<void> {
    await super.open(`/reports/youth/${childId}`);
    await this.expectYouth(name);
  }

  async expectYouth(name: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name })).toBeVisible();
  }

  stat(label: string): Locator {
    return this.page.getByTestId(`stat-${label}`).getByTestId('stat-value');
  }

  section(title: string): Locator {
    return this.page.getByRole('region', { name: title });
  }

  moduleRow(title: string): Locator {
    return this.page.getByRole('table', { name: 'Module completion' }).getByRole('row').filter({ hasText: title });
  }

  get noAccount(): Locator {
    return this.page.getByText(/has no youth account$/);
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t build the youth report' });
  }

  async retry(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t find that youth' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Reports are for directors and site leads' });
  }
}
