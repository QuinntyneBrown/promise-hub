import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The Learning Bond dashboard (mock: learning-bond-dashboard) and Export for funders (export-learning-bond). */
export class LearningBondDashboardPage extends BasePage {
  async openDashboard(): Promise<void> {
    await super.open('/learning-bond');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** One of the six figures, by its label, such as "Households invited". */
  figure(label: string): Locator {
    return this.page.getByTestId('dashboard-figures').locator('ph-stat').filter({ hasText: label });
  }

  /** The row of a covered program in the table. */
  row(program: string): Locator {
    return this.page.getByRole('row').filter({ hasText: program });
  }

  async period(label: 'Last 30 days' | 'Last 90 days' | 'All time'): Promise<void> {
    await this.page.getByLabel('Period').selectOption({ label });
  }

  get empty(): Locator {
    return this.page.getByText('Families will appear here as they start.');
  }

  async exportForFunders(): Promise<void> {
    await this.page.getByRole('button', { name: 'Export for funders' }).click();
    await this.page.getByRole('dialog').getByRole('button', { name: 'Export' }).click();
  }

  get exportReady(): Locator {
    return this.page.getByRole('dialog').getByTestId('export-ready');
  }
}
