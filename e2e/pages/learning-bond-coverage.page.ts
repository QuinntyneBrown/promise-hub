import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Learning Bond coverage: programs and the roles that see status (mock: learning-bond-coverage). */
export class LearningBondCoveragePage extends BasePage {
  async open(): Promise<void> {
    await super.open('/settings/learning-bond/coverage');
  }

  async expectShown(): Promise<void> {
    await expect(this.heading).toHaveText('Coverage');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get everyProgram(): Locator {
    return this.page.getByRole('radio', { name: /^Every program/ });
  }

  get chosenPrograms(): Locator {
    return this.page.getByRole('radio', { name: /^Chosen programs/ });
  }

  private get programGroup(): Locator {
    return this.page.getByRole('group', { name: 'Chosen programs' });
  }

  /** A program's box; its name carries the households it reaches, such as "After-School Tutoring 3 households". */
  program(name: string): Locator {
    return this.programGroup.getByRole('checkbox', { name: new RegExp(`^${name}`) });
  }

  async programLabels(): Promise<string[]> {
    return (await this.programGroup.locator('label').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  }

  get programError(): Locator {
    return this.programGroup.getByText(/^Choose /);
  }

  role(name: string): Locator {
    return this.page.getByRole('group', { name: 'Who sees each family’s status' }).getByRole('checkbox', { name: new RegExp(`^${name}`) });
  }

  async roleLabels(): Promise<string[]> {
    return (await this.page.getByRole('group', { name: 'Who sees each family’s status' }).locator('label').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix this first' });
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save changes' }).click();
  }

  get toast(): Locator {
    return this.page.getByTestId('toast');
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Admins set coverage' });
  }
}
