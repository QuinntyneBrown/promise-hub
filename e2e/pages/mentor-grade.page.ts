import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Grading a submission (mock: mentor-grade) with the approve-submission, request-revision and leave-grade dialogs.
 * Criteria are named by their description; scores are typed into their fields.
 */
export class MentorGradePage extends BasePage {
  async open(submissionId: string): Promise<void> {
    await super.open(`/mentoring/reviews/submissions/${submissionId}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }

  get status(): Locator {
    return this.page.getByTestId('review-status');
  }

  get subtitle(): Locator {
    return this.page.getByTestId('page-subtitle');
  }

  /** What the youth sent: the card's text. */
  get sent(): Locator {
    return this.page.getByRole('region', { name: /sent$/ });
  }

  get fileLink(): Locator {
    return this.page.getByRole('link', { name: /^Open the (photo|file) / });
  }

  score(criterion: string): Locator {
    return this.page.getByLabel(new RegExp(`^${criterion} \\(0 to \\d+\\)`));
  }

  async scoreAll(points: (number | null)[]): Promise<void> {
    const fields = this.page.getByRole('region', { name: 'Rubric' }).getByRole('spinbutton');
    for (let i = 0; i < points.length; i++) {
      await fields.nth(i).fill(points[i] === null ? '' : String(points[i]));
    }
  }

  get total(): Locator {
    return this.page.getByTestId('rubric-total');
  }

  get comment(): Locator {
    return this.page.getByLabel(/^Comment to /);
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ hasText: 'Fix these to continue' });
  }

  fieldError(criterion: string): Locator {
    return this.page.getByRole('region', { name: 'Rubric' }).locator('.field').filter({ hasText: criterion }).locator('[id$="-error"]');
  }

  async saveDraft(): Promise<void> {
    await this.page.getByRole('button', { name: 'Save draft' }).click();
  }

  async approve(): Promise<void> {
    await this.page.getByRole('button', { name: 'Approve', exact: true }).click();
  }

  async requestRevision(): Promise<void> {
    await this.page.getByRole('button', { name: 'Request revision' }).click();
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  async confirm(name: string): Promise<void> {
    await this.dialog.getByRole('button', { name, exact: true }).click();
  }

  get revisionNote(): Locator {
    return this.dialog.getByLabel('What should they change?');
  }

  get outcome(): Locator {
    return this.page.getByRole('region', { name: 'Your review' });
  }

  alert(title: string): Locator {
    return this.page.locator('ph-alert').filter({ hasText: title });
  }

  async loadLatest(): Promise<void> {
    await this.page.getByRole('button', { name: 'Load the latest' }).click();
  }

  toast(text: string): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', { name: 'We can’t find that submission' });
  }

  async backToReviews(): Promise<void> {
    await this.page.getByRole('link', { name: 'Reviews', exact: true }).click();
  }

  async apiStatus(id: string): Promise<number> {
    return this.page.evaluate(async (p) => (await fetch(p)).status, `/api/mentoring/submissions/${id}`);
  }
}
