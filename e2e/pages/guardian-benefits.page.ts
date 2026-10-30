import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The benefits check (mocks: learning-bond-benefits-offer, learning-bond-benefits-intake, learning-bond-benefits, learning-bond-benefit-review). */
export class GuardianBenefitsPage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** The offer on the confirmation or the guardian page. */
  get offer(): Locator {
    return this.page.getByTestId('benefits-offer');
  }

  async checkBenefits(): Promise<void> {
    await this.offer.getByRole('link', { name: 'Check benefits' }).click();
  }

  async notNow(): Promise<void> {
    await this.offer.getByRole('button', { name: 'Not now' }).click();
  }

  async agree(name: string): Promise<void> {
    await this.page.getByRole('checkbox', { name: /^I agree that Learning Bond may use what I’ve already given/ }).check();
    await this.page.getByLabel('Type your full name to sign').fill(name);
    await this.page.getByRole('button', { name: 'Agree', exact: true }).click();
  }

  async answer(size: string, marital: string, ccb: 'Yes' | 'No' | 'Not sure', income: 'Yes' | 'No'): Promise<void> {
    await this.page.getByLabel('How many people live with you, including you and your children?').fill(size);
    await this.page.getByLabel('Your marital status').selectOption({ label: marital });
    await this.page.getByRole('group', { name: 'Do you get the Canada Child Benefit now?' }).getByRole('radio', { name: ccb, exact: true }).check();
    await this.page.getByRole('group', { name: 'Has your income changed a lot since your last tax return?' }).getByRole('radio', { name: income, exact: true }).check();
    await this.page.getByRole('button', { name: 'Check my benefits' }).click();
  }

  fieldError(text: string): Locator {
    return this.page.getByText(text);
  }

  /** One benefit's card, by its name. */
  benefit(name: string): Locator {
    return this.page.getByTestId('benefit-card').filter({ hasText: name });
  }

  get alreadyGet(): Locator {
    return this.page.getByTestId('benefits-already');
  }

  async uploadFor(name: string, file: string, mimeType: string): Promise<void> {
    await this.benefit(name)
      .locator('input[type=file]')
      .setInputFiles({ name: file, mimeType, buffer: Buffer.alloc(800, 37) });
  }

  async editAddress(value: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Edit Address' }).click();
    await this.page.getByRole('dialog').getByLabel('Address', { exact: true }).fill(value);
    await this.page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  }

  get sent(): Locator {
    return this.page.getByTestId('benefit-sent');
  }
}
