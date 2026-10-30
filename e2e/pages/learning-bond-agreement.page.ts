import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** The Learning Bond data-handling agreement (mock: learning-bond-agreement), served from Settings while the module may still be off. */
export class LearningBondAgreementPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/settings/learning-bond/agreement');
  }

  async expectShown(): Promise<void> {
    await expect(this.heading).toHaveText('Learning Bond data-handling agreement');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /** The version line: "Version 2 · effective Thu 1 Oct 2026 · published by PromiseHub". */
  get version(): Locator {
    return this.page.getByTestId('agreement-version');
  }

  async sectionTitles(): Promise<string[]> {
    return (await this.page.getByTestId('agreement-text').getByRole('heading', { level: 2 }).allInnerTexts()).map((t) => t.trim());
  }

  authority(organization: string): Locator {
    return this.page.getByRole('checkbox', { name: `I have authority to accept this agreement for ${organization}` });
  }

  get authorityError(): Locator {
    return this.page.getByTestId('authority-error');
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix this first' });
  }

  get acceptButton(): Locator {
    return this.page.getByRole('button', { name: 'Accept', exact: true });
  }

  async accept(): Promise<void> {
    await this.acceptButton.click();
  }

  get askSomeoneElse(): Locator {
    return this.page.getByRole('button', { name: 'Ask someone else to sign' });
  }

  /** The success alert after accepting, or for an organization that already accepted. */
  get accepted(): Locator {
    return this.page.getByTestId('agreement-accepted');
  }

  get turnOn(): Locator {
    return this.page.getByRole('link', { name: 'Turn on Learning Bond' });
  }

  get chooseCoverage(): Locator {
    return this.page.getByRole('link', { name: 'Choose coverage' });
  }

  get backToLearningBond(): Locator {
    return this.page.getByRole('link', { name: 'Back to Learning Bond' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Admins accept the agreement' });
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load the agreement' });
  }
}
