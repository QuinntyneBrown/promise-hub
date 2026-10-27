import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** An assignment's brief and where the youth stands with it (mock: learn-assignment). */
export class LearnAssignmentPage extends BasePage {
  async open(id: string): Promise<void> {
    await super.open(`/learning/assignments/${id}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }

  /** The status badge beside the title. */
  get status(): Locator {
    return this.page.getByTestId('assignment-status');
  }

  /** A fact tile: Due, Submit or Points. */
  fact(label: string): Locator {
    return this.page.locator('ph-stat').filter({ hasText: label });
  }

  get task(): Locator {
    return this.page.getByRole('region', { name: 'The task' });
  }

  /** The rubric table's row for a criterion. */
  criterion(description: string): Locator {
    return this.page
      .getByRole('region', { name: 'How it’s graded' })
      .getByRole('row')
      .filter({ hasText: description });
  }

  get rubricTotal(): Locator {
    return this.page.getByRole('region', { name: 'How it’s graded' }).getByText(/Total possible/);
  }

  get reviewer(): Locator {
    return this.page.getByRole('region', { name: 'Who reviews it' });
  }

  /** The alert above the brief: draft, revision, late or closed. */
  get notice(): Locator {
    return this.page
      .getByRole('status')
      .filter({ hasText: /draft|revision|past its due date|closed/ });
  }

  get startButton(): Locator {
    return this.page.getByRole('link', { name: 'Start submission' });
  }

  get continueDraftButton(): Locator {
    return this.page.getByRole('link', { name: 'Continue your draft' });
  }

  get seeSubmissionButton(): Locator {
    return this.page.getByRole('link', { name: 'See your submission' });
  }

  get reviseButton(): Locator {
    return this.page.getByRole('link', { name: 'Revise your submission' });
  }

  async start(): Promise<void> {
    await this.startButton.click();
  }

  locked(what: string): Locator {
    return this.page.getByRole('heading', { name: `Finish ${what} first` });
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', {
      name: 'We can’t find that assignment',
    });
  }

  get loadError(): Locator {
    return this.page.getByRole('heading', {
      name: 'We couldn’t load this assignment',
    });
  }

  async apiStatus(id: string): Promise<number> {
    return this.page.evaluate(
      async (a) => (await fetch(`/api/learning/assignments/${a}`)).status,
      id,
    );
  }
}
