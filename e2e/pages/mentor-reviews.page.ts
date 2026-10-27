import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Reviews, the mentor's review queue (mock: mentor-reviews). */
export class MentorReviewsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/mentoring/reviews');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: /^Reviews/ })).toBeVisible();
  }

  /** Each waiting piece of work as its row text. */
  get rows(): Locator {
    return this.page.getByRole('region', { name: 'Waiting for your review' }).locator('tbody tr');
  }

  row(text: string): Locator {
    return this.rows.filter({ hasText: text });
  }

  async filter(name: 'All' | 'Assignments' | 'Quizzes'): Promise<void> {
    await this.page.getByRole('tab', { name: new RegExp(`^${name}`) }).click();
  }

  async review(youth: string, title: string): Promise<void> {
    await this.page.getByRole('link', { name: `Review ${youth}’s ${title}` }).click();
  }

  async openQuizApprovals(): Promise<void> {
    await this.page.getByRole('link', { name: 'Quiz approvals' }).click();
  }

  get caughtUp(): Locator {
    return this.page.getByRole('heading', { name: 'You’re all caught up' });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load your reviews' });
  }

  get forbidden(): Locator {
    return this.page.getByRole('heading', { name: 'Reviews are for mentors' });
  }

  async retry(): Promise<void> {
    await this.page.getByRole('button', { name: 'Try again' }).click();
  }

  async apiStatus(path = '/api/mentoring/reviews'): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, path);
  }
}
