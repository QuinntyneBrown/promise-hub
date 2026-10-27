import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Learning, the youth's lessons (mock: learning). */
export class LearningPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/learning');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Learning' })).toBeVisible();
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: 'No lessons yet' });
  }

  /** What the API answers this signed-in person for their own record. */
  async apiStatus(): Promise<number> {
    return this.page.evaluate(async () => (await fetch('/api/learning/me')).status);
  }

  /** The consent-required state (mock: consent-required). */
  get consentRequired(): Locator {
    return this.page.getByRole('heading', { name: 'A guardian needs to give consent' });
  }

  get asked(): Locator {
    return this.page.getByRole('heading', { name: 'We asked your guardian' });
  }

  get noGuardian(): Locator {
    return this.page.getByRole('heading', { name: 'We can’t reach a guardian' });
  }

  get gate(): Locator {
    return this.page.getByTestId('consent-gate');
  }

  async askGuardian(): Promise<void> {
    await this.page.getByRole('button', { name: 'Ask my guardian' }).click();
  }

  async checkAgain(): Promise<void> {
    await this.page.getByRole('button', { name: 'Check again' }).click();
  }

  /** What the API answers this signed-in person for their lessons. */
  async lessonsStatus(): Promise<number> {
    return this.page.evaluate(async () => (await fetch('/api/learning/lessons')).status);
  }
}
