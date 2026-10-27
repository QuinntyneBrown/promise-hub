import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The new-incident form (mock: new-incident). */
export class NewIncidentPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/incidents/new');
    await expect(this.heading).toBeVisible();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix' });
  }

  get supervisorNote(): Locator {
    return this.page.getByText(/^Goes to /);
  }

  async fill(report: { type: string; child: string; when: string; where: string; what: string; did: string; guardian: string; severity: string }): Promise<void> {
    await this.page.getByRole('group', { name: 'Type' }).getByRole('radio', { name: report.type }).check();
    await this.page.getByLabel('Child involved').selectOption({ label: report.child });
    await this.page.getByLabel('When').fill(report.when);
    await this.page.getByLabel('Where').selectOption({ label: report.where });
    await this.page.getByLabel('What happened').fill(report.what);
    await this.page.getByLabel('What you did').fill(report.did);
    await this.page.getByRole('group', { name: 'Guardian' }).getByRole('radio', { name: report.guardian }).check();
    await this.page.getByRole('group', { name: 'Severity' }).getByRole('radio', { name: new RegExp(`^${report.severity}`) }).check();
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Submit report' }).click();
  }
}
