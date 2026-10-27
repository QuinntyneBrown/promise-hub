import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A youth's competencies for their mentor (mock: mentor-competency). */
export class MentorCompetencyPage extends BasePage {
  async open(childId: string): Promise<void> {
    await super.open(`/mentoring/youth/${childId}/competencies`);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Competencies' })).toBeVisible();
  }

  get summary(): Locator {
    return this.page.getByTestId('competency-count');
  }

  /** Each competency's card, by name. */
  competency(name: string): Locator {
    return this.page.locator('article').filter({ has: this.page.getByRole('heading', { name, exact: true }) });
  }

  get names(): Locator {
    return this.page.locator('article h3');
  }

  async setLevel(name: string, level: string): Promise<void> {
    await this.page.getByRole('group', { name: `${name} level` }).getByRole('button', { name: level, exact: true }).click();
  }

  level(name: string, level: string): Locator {
    return this.page.getByRole('group', { name: `${name} level` }).getByRole('button', { name: level, exact: true });
  }

  notes(name: string): Locator {
    return this.page.getByLabel(`Notes on ${name}`);
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save changes' }).click();
  }

  get lastSaved(): Locator {
    return this.page.getByTestId('last-saved');
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  alert(title: string): Locator {
    return this.page.locator('ph-alert').filter({ hasText: title });
  }

  toast(text: string): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'No competencies yet' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'This youth isn’t assigned to you' });
  }

  async apiStatus(childId: string): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, `/api/mentoring/youth/${childId}/competencies`);
  }
}
