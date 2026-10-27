import { expect, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A submitted attempt's score, pass and review (mock: learn-quiz-result). */
export class LearnQuizResultPage extends BasePage {
  async open(attemptId: string): Promise<void> {
    await super.open(`/learning/attempts/${attemptId}`);
  }

  async expectOpen(title: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }

  /** The alert that says how it went: passed, not this time or no attempts left. */
  get outcome(): Locator {
    return this.page.getByRole('status').filter({ hasText: /You passed|Not this time|No attempts left/ });
  }

  /** A score tile: Your score, Pass mark or Attempt. */
  fact(label: string): Locator {
    return this.page.locator('ph-stat').filter({ hasText: label });
  }

  get review(): Locator {
    return this.page.getByRole('region', { name: 'Review your answers' });
  }

  /** One reviewed question, by its number and text. */
  reviewed(number: number): Locator {
    return this.review
      .getByRole('listitem')
      .filter({ has: this.page.getByRole('heading', { name: new RegExp(`^${number}\\. `) }) })
      .first();
  }

  get tryAgain(): Locator {
    return this.page.getByRole('link', { name: /Try again|Try for a better score/ });
  }

  get backToModule(): Locator {
    return this.page.getByRole('link', { name: 'Back to the module' });
  }

  get awaiting(): Locator {
    return this.page.getByRole('heading', { name: 'Waiting for your mentor' });
  }

  get notFound(): Locator {
    return this.page.getByRole('heading', { name: 'We can’t find that result' });
  }

  async apiStatus(id: string): Promise<number> {
    return this.page.evaluate(async (a) => (await fetch(`/api/learning/attempts/${a}`)).status, id);
  }
}
