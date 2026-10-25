import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The incident log (mock: incidents) and one incident (mock: incident). */
export class IncidentsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/incidents');
    await expect(this.heading).toBeVisible();
  }

  async openIncident(id: string): Promise<void> {
    await super.open(`/incidents/${id}`);
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Only supervisors can read the log' });
  }

  get status(): Locator {
    return this.page.getByTestId('incident-status');
  }

  list(name: 'Incidents' | 'Your reports'): Locator {
    return this.page.getByRole('list', { name });
  }

  facts(): Locator {
    return this.page.getByRole('main');
  }

  async report(): Promise<void> {
    await this.page.getByRole('main').getByRole('link', { name: 'Report an incident' }).click();
  }
}
