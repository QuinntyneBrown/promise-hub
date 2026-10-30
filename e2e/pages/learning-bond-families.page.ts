import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Learning Bond households (mock: learning-bond-families): each covered household's status and last change, for staff in the status roles. */
export class LearningBondFamiliesPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/learning-bond/families');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  async expectShown(): Promise<void> {
    await expect(this.heading).toHaveText('Learning Bond households');
  }

  get list(): Locator {
    return this.page.getByRole('list', { name: 'Covered households' });
  }

  async names(): Promise<string[]> {
    return (await this.list.getByTestId('list-title').allInnerTexts()).map((t) => t.trim());
  }

  household(name: string): Locator {
    return this.list.getByRole('listitem').filter({ has: this.page.getByTestId('list-title').getByText(name, { exact: true }) });
  }

  async filterByStatus(status: string): Promise<void> {
    await this.page.getByLabel('Status', { exact: true }).selectOption({ label: status });
  }

  async filterByProgram(program: string): Promise<void> {
    await this.page.getByLabel('Program', { exact: true }).selectOption({ label: program });
  }

  async markCallDone(name: string): Promise<void> {
    await this.household(name).getByRole('button', { name: 'Mark call done' }).click();
  }

  /** Mark the call with {guardian} done (mock: learning-bond-call-outcome). */
  get callDialog(): Locator {
    return this.page.getByRole('dialog', { name: /^Mark the call with .* done$/ });
  }

  async saveOutcome(outcome: 'Resumed' | 'Not interested' | 'No answer'): Promise<void> {
    await this.callDialog.getByRole('radio', { name: outcome }).check();
    await this.callDialog.getByRole('button', { name: 'Save outcome' }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Your role doesn’t see Learning Bond status' });
  }
}
