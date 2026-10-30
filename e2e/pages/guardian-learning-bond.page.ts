import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A guardian's Learning Bond page from the invitation link (mock: guardian-learning-bond), with the device code step first when needed. */
export class GuardianLearningBondPage extends BasePage {
  async openLink(token: string): Promise<void> {
    await super.open(`/g/learning-bond/${token}`);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** The agent's line, read with its speaker. */
  get agent(): Locator {
    return this.page.getByTestId('agent-text');
  }

  get children(): Locator {
    return this.page.getByTestId('learning-bond-children');
  }

  child(firstName: string): Locator {
    return this.children.getByRole('listitem').filter({ hasText: firstName });
  }

  /** Sends the code to the contact, then enters it (L2-026). */
  async verify(contact: string, code: string): Promise<void> {
    await this.page.getByRole('textbox').first().fill(contact);
    await this.page.getByRole('button', { name: /^(Send the code|Enviar el código|Envoyer le code)$/ }).click();
    await this.page.getByRole('textbox').first().fill(code);
    await this.page.getByRole('button', { name: /^(Continue|Continuar|Continuer)$/ }).click();
  }

  async continue(): Promise<void> {
    await this.page.getByRole('link', { name: /^(Continue|Continuar|Continuer)$/ }).click();
  }

  async choose(label: string): Promise<void> {
    await this.page.getByRole('button', { name: label, exact: true }).click();
  }

  get confirmation(): Locator {
    return this.page.getByTestId('learning-bond-choice');
  }

  /** The consent step (mock: learning-bond-consent): one box per child with the exact wording, the typed name and Agree. */
  consentBox(firstName: string): Locator {
    return this.page.getByRole('checkbox', { name: new RegExp(`^I agree that Learning Bond may collect ${firstName}’s`) });
  }

  async sign(name: string): Promise<void> {
    await this.page.getByLabel('Type your full name to sign').fill(name);
    await this.page.getByRole('button', { name: 'Agree', exact: true }).click();
  }

  fieldError(field: 'children' | 'typed-name'): Locator {
    return this.page.getByTestId(`consent-${field}-error`);
  }

  get consentRecorded(): Locator {
    return this.page.getByTestId('consent-recorded');
  }

  async expectCodeStep(): Promise<void> {
    await expect(this.heading).toHaveText(/^(Check it’s you|Confirme que es usted|Confirmez que c’est vous)$/);
  }
}
