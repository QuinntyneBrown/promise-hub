import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A youth’s record for their mentor (mock: mentor-youth-detail). */
export class MentorYouthDetailPage extends BasePage {
  async open(childId: string): Promise<void> {
    await super.open(`/mentoring/youth/${childId}`);
  }

  async expectOpen(name: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name })).toBeVisible();
  }

  get subtitle(): Locator {
    return this.page.locator('ph-page-header .subtitle');
  }

  fact(term: string): Locator {
    return this.page.getByRole('term').filter({ hasText: term }).locator('xpath=following-sibling::dd[1]');
  }

  get guardians(): Locator {
    return this.page.getByRole('list', { name: 'Guardian contacts' }).getByRole('listitem');
  }

  call(number: string): Locator {
    return this.page.getByRole('link', { name: number });
  }

  get attendance(): Locator {
    return this.page.getByRole('table', { name: 'Recent attendance' }).getByRole('row');
  }

  get attendanceHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Recent attendance' });
  }

  get restrictedNote(): Locator {
    return this.page.getByText('Medical details stay with staff on site');
  }

  /** The Shared reflections card's rows (L2-089 criterion 5). */
  get sharedReflections(): Locator {
    return this.page.getByRole('list', { name: 'Shared reflections, newest first' }).getByRole('listitem');
  }

  get sharedReflectionsCard(): Locator {
    return this.page.getByRole('region', { name: 'Shared reflections' });
  }

  get noSharedReflections(): Locator {
    return this.page.getByRole('heading', { name: 'No shared reflections yet' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'This youth isn’t assigned to you' });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load this record' });
  }

  async retry(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }

  /** The whole page text, to prove restricted fields never render. */
  async text(): Promise<string> {
    return (await this.page.locator('main').textContent()) ?? '';
  }

  async apiStatus(childId: string): Promise<number> {
    return this.page.evaluate(async (id) => (await fetch(`/api/mentoring/youth/${id}`)).status, childId);
  }

  async openCompetencies(): Promise<void> {
    await this.page.getByRole('link', { name: 'Competencies' }).click();
  }
}
