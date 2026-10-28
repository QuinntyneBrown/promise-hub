import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Mentoring, the mentor dashboard (mock: mentor-dashboard). */
export class MentoringPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/mentoring');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Mentoring' })).toBeVisible();
  }

  /** Assign work, offered while Learning is on (L2-092). */
  get assignWorkButton(): Locator {
    return this.page.getByRole('button', { name: 'Assign work' });
  }

  async assignWork(): Promise<void> {
    await this.assignWorkButton.click();
  }

  toast(text: string): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }

  async openFlags(): Promise<void> {
    await this.page.getByRole('link', { name: 'At-risk flags' }).click();
  }

  async openCheckIns(): Promise<void> {
    await this.page.getByRole('link', { name: 'Mentor check-ins' }).click();
  }

  /** The Follow-ups card's rows, soonest first (L2-090 criterion 6). */
  get followUps(): Locator {
    return this.page.getByRole('list', { name: 'Follow-ups, soonest first' }).getByRole('listitem');
  }

  get noFollowUps(): Locator {
    return this.page.getByRole('heading', { name: 'No follow-ups planned' });
  }

  async openFollowUp(name: string): Promise<void> {
    await this.followUps.getByRole('link', { name }).click();
  }

  get emptyState(): Locator {
    return this.page.getByRole('heading', { name: 'No youth assigned yet' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Mentoring is for mentors' });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load your dashboard' });
  }

  async retry(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }

  /** The first youth on the dashboard, by name. */
  get youth(): Locator {
    return this.page.getByRole('list', { name: 'Your youth' }).getByTestId('list-title');
  }

  get cohorts(): Locator {
    return this.page.getByRole('list', { name: 'Your cohorts' }).getByTestId('list-title');
  }

  /** The value of one of the numbers at the top: My youth, My cohorts, Checked in this week. */
  stat(label: string): Locator {
    return this.page.locator('ph-stat').filter({ hasText: label }).getByTestId('stat-value');
  }

  get statLabels(): Locator {
    return this.page.locator('ph-stat .label');
  }

  get activity(): Locator {
    return this.page.getByRole('list', { name: 'Recent activity' }).getByRole('listitem');
  }

  get activityHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Recent activity' });
  }

  /** The Reviews button, with the number waiting; only while Learning is on. */
  get reviewsButton(): Locator {
    return this.page.getByRole('link', { name: /^Reviews/ });
  }

  async viewAll(): Promise<void> {
    await this.page.getByRole('link', { name: /^View all/ }).click();
  }

  async openYouth(name: string): Promise<void> {
    await this.page.getByRole('list', { name: 'Your youth' }).getByRole('link', { name: new RegExp(`^${name}`) }).click();
  }

  async openCohort(name: string): Promise<void> {
    await this.page.getByRole('list', { name: 'Your cohorts' }).getByRole('link', { name: new RegExp(`^${name}`) }).click();
  }

  async apiStatus(path = '/api/mentoring/youth'): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }
}
