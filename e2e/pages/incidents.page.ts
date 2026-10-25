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

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get reviewed(): Locator {
    return this.page.getByRole('main').getByRole('status').filter({ hasText: 'Reviewed' });
  }

  list2(name: 'Follow-up' | 'Trail'): Locator {
    return this.page.getByRole('list', { name });
  }

  action(name: 'Mark reviewed' | 'Add follow-up' | 'Reopen'): Locator {
    return this.page.getByRole('main').getByRole('button', { name, exact: true });
  }

  async markReviewed(note: string, outcome: 'Closed, no further action' | 'Closed, policy change needed' | 'Keep open'): Promise<void> {
    await this.action('Mark reviewed').click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('textbox').fill(note);
    await this.dialog.getByRole('radio', { name: new RegExp(`^${outcome}`) }).check();
    await this.dialog.getByRole('button', { name: 'Mark reviewed' }).click();
  }

  async addFollowUp(text: string): Promise<void> {
    await this.action('Add follow-up').click();
    await expect(this.dialog).toBeVisible();
    await this.dialog.getByRole('textbox').fill(text);
    await this.dialog.getByRole('button', { name: 'Add follow-up' }).click();
  }

  async reopen(): Promise<void> {
    await this.action('Reopen').click();
    await this.dialog.getByRole('button', { name: 'Reopen' }).click();
  }

  async report(): Promise<void> {
    await this.page.getByRole('main').getByRole('link', { name: 'Report an incident' }).click();
  }
}
