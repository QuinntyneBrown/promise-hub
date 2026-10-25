import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Check-in (mock: check-in) with the check-in sheet and the add-walk-in dialog. */
export class CheckInPage extends BasePage {
  async open(path = '/check-in'): Promise<void> {
    await super.open(path);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get roster(): Locator {
    return this.page.getByRole('list', { name: /^Roster for / });
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  total(label: 'Checked in' | 'Absent' | 'Not yet'): Locator {
    return this.page.getByRole('group', { name: 'Session totals' }).getByTestId(`total-${label}`).getByTestId('stat-value');
  }

  row(name: string): Locator {
    return this.roster.getByRole('listitem').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async names(): Promise<string[]> {
    return (await this.roster.getByTestId('roster-name').allInnerTexts()).map((t) => t.trim());
  }

  async checkIn(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: `Check in ${name}` }).click();
  }

  async openOptions(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: `More for ${name}` }).click();
    await expect(this.dialog).toBeVisible();
  }

  async markAbsent(name: string): Promise<void> {
    await this.openOptions(name);
    await this.dialog.getByRole('radio', { name: /^Mark absent instead/ }).check();
    await this.dialog.getByRole('button', { name: 'Mark absent' }).click();
    await expect(this.dialog).toBeHidden();
  }

  async search(text: string): Promise<void> {
    await this.page.getByRole('searchbox', { name: 'Find a child' }).fill(text);
  }

  async filter(name: string): Promise<void> {
    await this.page.getByRole('group', { name: 'Filter roster' }).getByRole('button', { name: new RegExp(`^${name}`) }).click();
  }

  async addWalkIn(values: { childName: string; guardian: string }): Promise<void> {
    await this.dialog.getByLabel('Child’s name').fill(values.childName);
    await this.dialog.getByLabel('Guardian’s name and phone').fill(values.guardian);
    await this.dialog.getByRole('button', { name: 'Check in for tonight' }).click();
  }
}
