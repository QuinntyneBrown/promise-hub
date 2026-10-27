import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** Quiz approvals (mock: mentor-quiz-approvals) with the approve-quiz and approve-all-quizzes dialogs. */
export class MentorQuizApprovalsPage extends BasePage {
  async open(): Promise<void> {
    await super.open('/mentoring/reviews/quizzes');
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Quiz approvals' })).toBeVisible();
  }

  get rows(): Locator {
    return this.page.getByRole('region', { name: 'Quiz results waiting for approval' }).locator('tbody tr');
  }

  async approve(youth: string, quiz: string): Promise<void> {
    await this.page.getByRole('button', { name: `Approve ${youth}’s ${quiz}` }).click();
  }

  async approveAll(): Promise<void> {
    await this.page.getByRole('button', { name: 'Approve all' }).click();
  }

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get override(): Locator {
    return this.dialog.getByLabel('Override score');
  }

  async confirm(name: string): Promise<void> {
    await this.dialog.getByRole('button', { name, exact: true }).click();
  }

  toast(text: string): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }

  get empty(): Locator {
    return this.page.getByRole('heading', { name: 'No quiz results to approve' });
  }

  get failed(): Locator {
    return this.page.getByRole('heading', { name: 'We couldn’t load quiz results' });
  }

  async apiStatus(): Promise<number> {
    return this.page.evaluate(async () => (await fetch('/api/mentoring/quiz-approvals')).status);
  }
}
